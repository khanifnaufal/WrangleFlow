import { useMemo, useState } from 'react';
import Papa from 'papaparse';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import './App.css';

const toTitleCase = (text) =>
  String(text)
    .toLowerCase()
    .replace(/\b([a-z])/g, (match) => match.toUpperCase());

const parseValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const num = Number(value);
  if (!Number.isNaN(num) && value !== true && value !== false && value !== '') return num;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime()) && String(value).length > 0) return value;
  return String(value);
};

const detectColumnType = (values) => {
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  if (nonEmpty.length === 0) return 'string';

  const allNumber = nonEmpty.every((v) => !Number.isNaN(Number(v)));
  if (allNumber) return 'number';

  const allDate = nonEmpty.every((v) => {
    const d = new Date(v);
    return !Number.isNaN(d.getTime());
  });
  if (allDate) return 'date';

  return 'string';
};

const detectDataTypes = (data = [], columns = []) => {
  const types = {};
  columns.forEach((col) => {
    const values = data.map((row) => row[col]);
    types[col] = detectColumnType(values);
  });
  return types;
};

const normalizeRow = (row, columns) => {
  const normalized = {};
  columns.forEach((key) => {
    normalized[key] = row[key] === undefined ? null : row[key];
  });
  return normalized;
};

function App() {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [pipeline, setPipeline] = useState([]);
  const [projectName, setProjectName] = useState('WrangleFlow dataset');

  const [selectedColumn, setSelectedColumn] = useState('');
  const [missingStrategy, setMissingStrategy] = useState('drop');
  const [textFormat, setTextFormat] = useState('lowercase');
  const [dateColumn, setDateColumn] = useState('');
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [deleteColumnName, setDeleteColumnName] = useState('');
  const [typeColumn, setTypeColumn] = useState('');
  const [targetType, setTargetType] = useState('number');

  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const dataTypes = useMemo(() => detectDataTypes(data, columns), [data, columns]);

  const tableColumns = useMemo(
    () =>
      columns.map((col) => ({
        accessorKey: col,
        header: col,
        cell: (info) => (
          <div className="table-cell truncate" title={String(info.getValue() ?? '')}>
            {String(info.getValue() ?? '')}
          </div>
        ),
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount: Math.ceil(data.length / pageSize),
    state: {
      pagination: { pageIndex, pageSize },
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      setPageIndex(next.pageIndex);
      setPageSize(next.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const addPipelineStep = (description) => {
    setPipeline((prev) => [{ at: new Date().toISOString(), description }, ...prev]);
  };

  const loadData = (rawRows) => {
    const resolved = rawRows.map((row) => {
      if (typeof row !== 'object' || row === null) return {};
      return Object.fromEntries(Object.entries(row).map(([k, v]) => [k, v]));
    });
    const keySet = new Set();
    resolved.forEach((row) => Object.keys(row).forEach((k) => keySet.add(k)));
    const finalColumns = Array.from(keySet);

    const normalized = resolved.map((row) => normalizeRow(row, finalColumns));
    setData(normalized);
    setColumns(finalColumns);
    setPipeline([{ at: new Date().toISOString(), description: `Loaded ${normalized.length} rows from file` }]);
    setPageIndex(0);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (!text) return;

      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(text.toString());
          if (!Array.isArray(parsed)) {
            addPipelineStep('JSON loaded but not array; expecting top-level array.');
            return;
          }
          loadData(parsed);
        } catch (error) {
          addPipelineStep(`Invalid JSON: ${error}`);
        }
      } else {
        Papa.parse(text.toString(), {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
          complete: (results) => {
            if (results.errors.length) {
              addPipelineStep(`CSV parse warnings: ${results.errors.length} errors`);
            }
            loadData(results.data);
          },
          error: (error) => addPipelineStep(`CSV parse error: ${error.message}`),
        });
      }
    };

    reader.readAsText(file);
  };

  const applyTransformation = (description, transformFn) => {
    setData((prev) => {
      const next = transformFn(prev);
      setPageIndex(0);
      return next;
    });
    addPipelineStep(description);
  };

  const removeDuplicates = () => {
    applyTransformation('Removed duplicate rows', (prev) => {
      const set = new Set();
      return prev.filter((row) => {
        const key = JSON.stringify(row);
        if (set.has(key)) return false;
        set.add(key);
        return true;
      });
    });
  };

  const trimWhitespace = () => {
    applyTransformation('Trimmed whitespace in all text values', (prev) =>
      prev.map((row) => {
        const out = { ...row };
        Object.keys(out).forEach((k) => {
          if (typeof out[k] === 'string') out[k] = out[k].trim();
        });
        return out;
      })
    );
  };

  const handleMissing = () => {
    if (!selectedColumn) return;

    applyTransformation(`Missing value strategy '${missingStrategy}' on ${selectedColumn}`, (prev) => {
      const values = prev
        .map((row) => row[selectedColumn])
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== '');

      const numeric = values.every((v) => !Number.isNaN(Number(v)));
      const getStatistic = () => {
        if (!numeric) return null;
        const nums = values.map((v) => Number(v));
        if (!nums.length) return null;
        if (missingStrategy === 'mean') return nums.reduce((a, b) => a + b, 0) / nums.length;
        if (missingStrategy === 'median') {
          const sorted = nums.slice().sort((a, b) => a - b);
          const middle = Math.floor(sorted.length / 2);
          return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
        }
        return null;
      };

      const fillValue = getStatistic();

      return prev
        .map((row) => {
          const current = row[selectedColumn];
          const missing = current === null || current === undefined || String(current).trim() === '';
          if (missing) {
            if (missingStrategy === 'drop') return null;
            if (missingStrategy === 'mean' || missingStrategy === 'median') {
              return {
                ...row,
                [selectedColumn]: fillValue !== null ? fillValue : row[selectedColumn],
              };
            }
            return row;
          }
          return row;
        })
        .filter(Boolean);
    });
  };

  const convertDate = () => {
    if (!dateColumn) return;
    applyTransformation(`Converted date values to ISO in ${dateColumn}`, (prev) =>
      prev.map((row) => {
        const value = row[dateColumn];
        if (value == null || String(value).trim() === '') return row;
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return row;
        return { ...row, [dateColumn]: d.toISOString() };
      })
    );
  };

  const normalizeText = () => {
    if (!selectedColumn) return;
    applyTransformation(`Applied ${textFormat} normalization on ${selectedColumn}`, (prev) =>
      prev.map((row) => {
        const value = row[selectedColumn];
        if (value === null || value === undefined) return row;
        if (typeof value !== 'string') return row;

        let normalized = value;
        if (textFormat === 'lowercase') normalized = value.toLowerCase();
        if (textFormat === 'uppercase') normalized = value.toUpperCase();
        if (textFormat === 'titlecase') normalized = toTitleCase(value);

        return { ...row, [selectedColumn]: normalized };
      })
    );
  };

  const renameColumn = () => {
    if (!renameFrom || !renameTo || renameFrom === renameTo) return;
    if (!columns.includes(renameFrom)) return;

    setColumns((prev) => prev.map((col) => (col === renameFrom ? renameTo : col)));

    applyTransformation(`Renamed column ${renameFrom}  ${renameTo}`, (prev) =>
      prev.map((row) => {
        const newRow = { ...row };
        if (Object.prototype.hasOwnProperty.call(newRow, renameFrom)) {
          newRow[renameTo] = newRow[renameFrom];
          delete newRow[renameFrom];
        }
        return newRow;
      })
    );
    setRenameFrom('');
    setRenameTo('');
  };

  const deleteColumn = () => {
    if (!deleteColumnName || !columns.includes(deleteColumnName)) return;

    setColumns((prev) => prev.filter((col) => col !== deleteColumnName));

    applyTransformation(`Deleted column ${deleteColumnName}`, (prev) =>
      prev.map((row) => {
        const newRow = { ...row };
        delete newRow[deleteColumnName];
        return newRow;
      })
    );
    setDeleteColumnName('');
  };

  const changeType = () => {
    if (!typeColumn || !columns.includes(typeColumn)) return;

    applyTransformation(`Changed type of ${typeColumn} to ${targetType}`, (prev) =>
      prev.map((row) => {
        const raw = row[typeColumn];
        let converted = raw;
        if (targetType === 'number') {
          const n = Number(raw);
          converted = Number.isNaN(n) ? null : n;
        }
        if (targetType === 'string') converted = raw === null || raw === undefined ? '' : String(raw);
        if (targetType === 'date') {
          const d = new Date(raw);
          converted = Number.isNaN(d.getTime()) ? null : d.toISOString();
        }
        return { ...row, [typeColumn]: converted };
      })
    );
    setTypeColumn('');
  };

  const exportCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${projectName.replace(/\s+/g, '_') || 'dataset'}.csv`;
    link.click();
    URL.revokeObjectURL(href);
    addPipelineStep('Exported as CSV');
  };

  const exportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${projectName.replace(/\s+/g, '_') || 'dataset'}.json`;
    link.click();
    URL.revokeObjectURL(href);
    addPipelineStep('Exported as JSON');
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-slate-50 text-slate-800">
      <div className="max-w-screen-xl mx-auto space-y-5">
        <header className="rounded-xl p-4 bg-white shadow-sm border border-slate-200">
          <h1 className="text-2xl font-semibold text-slate-900">WrangleFlow</h1>
          <p className="text-sm text-slate-600 mt-1">
            Client-side data wrangling dashboard (CSV/JSON) with transformations, data preview, and export.
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
              <label className="block mb-2 text-sm font-medium text-slate-700">Upload CSV/JSON</label>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-slate-700 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>

            <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Pipeline</h2>
              <div className="space-y-2">
                {pipeline.length === 0 && <p className="text-sm text-slate-500">No transformations yet.</p>}
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {pipeline.map((step, index) => (
                    <li key={`${step.at}-${index}`} className="rounded-md bg-slate-50 p-2 text-sm border border-slate-200">
                      <div className="text-slate-800">{step.description}</div>
                      <div className="text-xs text-slate-500">{step.at}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <button onClick={removeDuplicates} className="w-full py-2 rounded-md bg-slate-800 text-white hover:bg-slate-900">
                Remove Duplicates
              </button>
              <button onClick={trimWhitespace} className="w-full py-2 rounded-md bg-slate-800 text-white hover:bg-slate-900">
                Trim Whitespace
              </button>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Missing values</label>
                <select
                  value={missingStrategy}
                  onChange={(e) => setMissingStrategy(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="drop">Drop Rows</option>
                  <option value="mean">Fill Mean</option>
                  <option value="median">Fill Median</option>
                </select>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="">Choose Column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <button onClick={handleMissing} className="w-full py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                  Apply
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Normalize text column</label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="">Choose Column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <select
                  value={textFormat}
                  onChange={(e) => setTextFormat(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="lowercase">Lowercase</option>
                  <option value="uppercase">Uppercase</option>
                  <option value="titlecase">Title Case</option>
                </select>
                <button onClick={normalizeText} className="w-full py-2 rounded-md bg-amber-600 text-white hover:bg-amber-700">
                  Apply
                </button>
              </div>

              <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium">Convert date to ISO</label>
                <select
                  value={dateColumn}
                  onChange={(e) => setDateColumn(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="">Choose Date Column</option>
                  {columns.filter((col) => dataTypes[col] === 'string' || dataTypes[col] === 'date').map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <button onClick={convertDate} className="w-full py-2 rounded-md bg-blue-700 text-white hover:bg-blue-800">
                  Convert
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Rename column</label>
                <select
                  value={renameFrom}
                  onChange={(e) => setRenameFrom(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="">Select Existing Column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <input
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                  placeholder="New column name"
                  className="w-full rounded border border-slate-300 p-2"
                />
                <button onClick={renameColumn} className="w-full py-2 rounded-md bg-pink-600 text-white hover:bg-pink-700">
                  Rename
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Delete column</label>
                <select
                  value={deleteColumnName}
                  onChange={(e) => setDeleteColumnName(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="">Choose Column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
                <button onClick={deleteColumn} className="w-full py-2 rounded-md bg-red-600 text-white hover:bg-red-700">
                  Delete
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Change data type</label>
                <select
                  value={typeColumn}
                  onChange={(e) => setTypeColumn(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="">Choose Column</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>
                      {col} ({dataTypes[col]})
                    </option>
                  ))}
                </select>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="date">date</option>
                </select>
                <button onClick={changeType} className="w-full py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700">
                  Convert
                </button>
              </div>
            </div>
          </div>

          <aside className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Live statistics</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div>Rows: <strong>{data.length}</strong></div>
              <div>Columns: <strong>{columns.length}</strong></div>
              <div className="pt-2 font-medium text-slate-700">Detected types</div>
              <ul className="space-y-1 max-h-48 overflow-y-auto text-xs text-slate-600">
                {columns.map((col) => (
                  <li key={col} className="flex justify-between px-2 py-1 rounded bg-slate-50">
                    <span>{col}</span>
                    <span className="font-semibold">{dataTypes[col] || 'unknown'}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 space-y-2">
              <button onClick={exportCSV} className="w-full py-2 rounded-md bg-slate-800 text-white hover:bg-slate-900">
                Export CSV
              </button>
              <button onClick={exportJSON} className="w-full py-2 rounded-md bg-slate-800 text-white hover:bg-slate-900">
                Export JSON
              </button>
            </div>
          </aside>
        </section>

        <section className="rounded-xl p-4 bg-white border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Data preview</h2>
          {data.length === 0 ? (
            <p className="text-slate-500">Upload data to preview table with pagination and operations.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <th key={header.id} className="px-3 py-2 border-b border-slate-200">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map((row) => (
                      <tr key={row.id} className="odd:bg-white even:bg-slate-50">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-3 py-2 text-sm text-slate-700 border-b border-slate-200">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
                >
                  Next
                </button>
                <span>
                  Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of <strong>{table.getPageCount()}</strong>
                </span>
                <label className="flex items-center gap-2">
                  Rows per page:
                  <select
                    value={table.getState().pagination.pageSize}
                    onChange={(e) => {
                      table.setPageSize(Number(e.target.value));
                    }}
                    className="rounded border border-slate-300 p-1"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;
