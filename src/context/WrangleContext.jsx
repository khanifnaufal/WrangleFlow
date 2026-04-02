import { createContext, useContext, useState, useMemo, useEffect } from 'react';
import Papa from 'papaparse';
import { detectDataTypes, getColumnStats, buildQualityReport, normalizeRow, toTitleCase } from '../utils/helpers';

export const WrangleContext = createContext(null);

export function WrangleProvider({ children }) {
  // ── Theme ──
  const [dark, setDark] = useState(() => localStorage.getItem('wf-dark') === 'true');

  useEffect(() => {
    localStorage.setItem('wf-dark', dark);
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // ── Core data ──
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [pipeline, setPipeline] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wf-pipeline') || '[]'); } catch { return []; }
  });
  const [history, setHistory] = useState([]);   // [{data, columns}]
  const [future,  setFuture]  = useState([]);

  // ── Transform state ──
  const [missingCol,     setMissingCol]     = useState('');
  const [missStrategy,   setMissStrategy]   = useState('drop');
  const [normalizeCol,   setNormalizeCol]   = useState('');
  const [textFmt,        setTextFmt]        = useState('lowercase');
  const [dateCol,        setDateCol]        = useState('');
  const [renameFrom,     setRenameFrom]     = useState('');
  const [renameTo,       setRenameTo]       = useState('');
  const [delCol,         setDelCol]         = useState('');
  const [typeCol,        setTypeCol]        = useState('');
  const [targetType,     setTargetType]     = useState('number');
  const [frCol,          setFrCol]          = useState('');
  const [findVal,        setFindVal]        = useState('');
  const [replaceVal,     setReplaceVal]     = useState('');
  const [filterCol,      setFilterCol]      = useState('');
  const [filterOp,       setFilterOp]       = useState('contains');
  const [filterVal,      setFilterVal]      = useState('');

  // ── UI state ──
  const [activeMainTab,  setActiveMainTab]  = useState('preview');  // preview | quality
  const [activeTxTab,    setActiveTxTab]    = useState('clean');    // clean | text | columns | filter
  const [statsCol,       setStatsCol]       = useState('');
  const [projectName,    setProjectName]    = useState('dataset');

  // ── Derived ──
  const dataTypes   = useMemo(() => detectDataTypes(data, columns), [data, columns]);
  const colStats    = useMemo(() => statsCol && columns.includes(statsCol) ? getColumnStats(data, statsCol, dataTypes[statsCol]) : null, [statsCol, data, columns, dataTypes]);
  const qualReport  = useMemo(() => data.length ? buildQualityReport(data, columns, dataTypes) : null, [data, columns, dataTypes]);

  // Save pipeline to localStorage
  useEffect(() => { localStorage.setItem('wf-pipeline', JSON.stringify(pipeline)); }, [pipeline]);

  // ─── Pipeline helpers ─────────────────────────────────────────────────────
  const log = (desc) => setPipeline((p) => [{ at: new Date().toISOString(), description: desc }, ...p]);

  const applyTx = (desc, dataFn, colsFn = null) => {
    setHistory((h) => [...h, { data, columns }]);
    setFuture([]);
    const nd = dataFn(data);
    const nc = colsFn ? colsFn(columns) : columns;
    setData(nd);
    if (colsFn) setColumns(nc);
    log(desc);
  };

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((f) => [{ data, columns }, ...f]);
    setHistory((h) => h.slice(0, -1));
    setData(prev.data); setColumns(prev.columns);
    log('↩ Undo');
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((h) => [...h, { data, columns }]);
    setFuture((f) => f.slice(1));
    setData(next.data); setColumns(next.columns);
    log('↪ Redo');
  };

  // ─── File loading ─────────────────────────────────────────────────────────
  const loadData = (rawRows, filename = '') => {
    const resolved = rawRows.map((row) => (typeof row !== 'object' || !row ? {} : { ...row }));
    const keySet = new Set();
    resolved.forEach((row) => Object.keys(row).forEach((k) => keySet.add(k)));
    const cols = Array.from(keySet);
    const norm = resolved.map((r) => normalizeRow(r, cols));
    setData(norm); setColumns(cols);
    setHistory([]); setFuture([]);
    setPipeline([{ at: new Date().toISOString(), description: `Loaded ${norm.length.toLocaleString()} rows × ${cols.length} cols${filename ? ` — "${filename}"` : ''}` }]);
  };

  const parseFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result?.toString() ?? '';
      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) { log('JSON must be a top-level array'); return; }
          loadData(parsed, file.name);
        } catch (err) { log(`JSON parse error: ${err}`); }
      } else {
        Papa.parse(text, {
          header: true, skipEmptyLines: true, dynamicTyping: false,
          complete: (r) => { if (r.errors.length) log(`CSV warnings: ${r.errors.length} issues`); loadData(r.data, file.name); },
          error: (err) => log(`CSV error: ${err.message}`),
        });
      }
    };
    reader.readAsText(file);
  };

  // ─── Transformations ──────────────────────────────────────────────────────
  const removeDuplicates = () => applyTx('Removed duplicate rows', (prev) => {
    const seen = new Set();
    return prev.filter((row) => { const k = JSON.stringify(row); if (seen.has(k)) return false; seen.add(k); return true; });
  });

  const trimWhitespace = () => applyTx('Trimmed whitespace in all string values', (prev) =>
    prev.map((row) => { const r = { ...row }; Object.keys(r).forEach((k) => { if (typeof r[k] === 'string') r[k] = r[k].trim(); }); return r; })
  );

  const handleMissing = () => {
    if (!missingCol) return;
    applyTx(`Missing: "${missStrategy}" on "${missingCol}"`, (prev) => {
      const ne = prev.map((r) => r[missingCol]).filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
      const isNum = ne.every((v) => !Number.isNaN(Number(v)));
      let fill = null;
      if (isNum && missStrategy !== 'drop') {
        const nums = ne.map(Number);
        if (missStrategy === 'mean') fill = nums.reduce((a, b) => a + b, 0) / nums.length;
        if (missStrategy === 'median') { const s = [...nums].sort((a, b) => a - b); const m = Math.floor(s.length / 2); fill = s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m]; }
      }
      return prev.map((row) => {
        const isMiss = row[missingCol] === null || row[missingCol] === undefined || String(row[missingCol]).trim() === '';
        if (!isMiss) return row;
        if (missStrategy === 'drop') return null;
        return { ...row, [missingCol]: fill !== null ? fill : row[missingCol] };
      }).filter(Boolean);
    });
  };

  const normalizeText = () => {
    if (!normalizeCol) return;
    applyTx(`Text: "${textFmt}" on "${normalizeCol}"`, (prev) =>
      prev.map((row) => {
        const v = row[normalizeCol];
        if (typeof v !== 'string') return row;
        const n = textFmt === 'lowercase' ? v.toLowerCase() : textFmt === 'uppercase' ? v.toUpperCase() : toTitleCase(v);
        return { ...row, [normalizeCol]: n };
      })
    );
  };

  const convertDate = () => {
    if (!dateCol) return;
    applyTx(`Converted "${dateCol}" to ISO 8601`, (prev) =>
      prev.map((row) => { const d = new Date(row[dateCol]); return Number.isNaN(d.getTime()) ? row : { ...row, [dateCol]: d.toISOString() }; })
    );
  };

  const findReplace = () => {
    if (!frCol || findVal === '') return;
    applyTx(`Find "${findVal}" → "${replaceVal}" in "${frCol}"`, (prev) =>
      prev.map((row) => String(row[frCol] ?? '') === findVal ? { ...row, [frCol]: replaceVal } : row)
    );
    setFindVal(''); setReplaceVal('');
  };

  const renameColumn = () => {
    if (!renameFrom || !renameTo || renameFrom === renameTo || !columns.includes(renameFrom)) return;
    applyTx(`Renamed "${renameFrom}" → "${renameTo}"`,
      (prev) => prev.map((row) => { const r = { ...row }; r[renameTo] = r[renameFrom]; delete r[renameFrom]; return r; }),
      (cols) => cols.map((c) => (c === renameFrom ? renameTo : c))
    );
    setRenameFrom(''); setRenameTo('');
  };

  const deleteColumn = () => {
    if (!delCol || !columns.includes(delCol)) return;
    applyTx(`Deleted column "${delCol}"`,
      (prev) => prev.map((row) => { const r = { ...row }; delete r[delCol]; return r; }),
      (cols) => cols.filter((c) => c !== delCol)
    );
    setDelCol('');
  };

  const changeType = () => {
    if (!typeCol || !columns.includes(typeCol)) return;
    applyTx(`Type of "${typeCol}" → ${targetType}`, (prev) =>
      prev.map((row) => {
        const raw = row[typeCol];
        let v = raw;
        if (targetType === 'number') { const n = Number(raw); v = Number.isNaN(n) ? null : n; }
        if (targetType === 'string') v = raw == null ? '' : String(raw);
        if (targetType === 'date')   { const d = new Date(raw); v = Number.isNaN(d.getTime()) ? null : d.toISOString(); }
        return { ...row, [typeCol]: v };
      })
    );
    setTypeCol('');
  };

  const applyRowFilter = () => {
    if (!filterCol || filterVal === '') return;
    applyTx(`Filter: "${filterCol}" ${filterOp} "${filterVal}"`, (prev) =>
      prev.filter((row) => {
        const v = String(row[filterCol] ?? '');
        const fv = filterVal;
        if (filterOp === 'contains')    return v.toLowerCase().includes(fv.toLowerCase());
        if (filterOp === 'equals')      return v === fv;
        if (filterOp === 'not_equals')  return v !== fv;
        if (filterOp === 'starts_with') return v.toLowerCase().startsWith(fv.toLowerCase());
        if (filterOp === 'gt')  return Number(v) > Number(fv);
        if (filterOp === 'lt')  return Number(v) < Number(fv);
        if (filterOp === 'gte') return Number(v) >= Number(fv);
        if (filterOp === 'lte') return Number(v) <= Number(fv);
        return true;
      })
    );
    setFilterVal('');
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const exportFile = (type) => {
    if (!data.length) return;
    const name = (projectName.trim().replace(/\s+/g, '_') || 'dataset') + '.' + type;
    const content = type === 'csv' ? Papa.unparse(data) : JSON.stringify(data, null, 2);
    const mime = type === 'csv' ? 'text/csv' : 'application/json';
    const href = URL.createObjectURL(new Blob([content], { type: mime }));
    Object.assign(document.createElement('a'), { href, download: name }).click();
    URL.revokeObjectURL(href);
    log(`Exported as ${type.toUpperCase()}`);
  };

  const clearAll = () => {
    if (!window.confirm('Clear all data and reset?')) return;
    setData([]); setColumns([]); setPipeline([]); setHistory([]); setFuture([]);
  };

  const value = {
    dark, setDark,
    data, columns, pipeline, history, future,
    dataTypes, colStats, qualReport,
    missingCol, setMissingCol, missStrategy, setMissStrategy,
    normalizeCol, setNormalizeCol, textFmt, setTextFmt,
    dateCol, setDateCol,
    renameFrom, setRenameFrom, renameTo, setRenameTo,
    delCol, setDelCol,
    typeCol, setTypeCol, targetType, setTargetType,
    frCol, setFrCol, findVal, setFindVal, replaceVal, setReplaceVal,
    filterCol, setFilterCol, filterOp, setFilterOp, filterVal, setFilterVal,
    activeMainTab, setActiveMainTab,
    activeTxTab, setActiveTxTab,
    statsCol, setStatsCol,
    projectName, setProjectName,
    parseFile,
    removeDuplicates, trimWhitespace, handleMissing, normalizeText,
    convertDate, findReplace, renameColumn, deleteColumn, changeType,
    applyRowFilter, exportFile, clearAll, undo, redo,
  };

  return (
    <WrangleContext.Provider value={value}>
      {children}
    </WrangleContext.Provider>
  );
}

export function useWrangle() {
  const context = useContext(WrangleContext);
  if (!context) {
    throw new Error('useWrangle must be used within a WrangleProvider');
  }
  return context;
}
