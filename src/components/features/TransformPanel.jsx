import { useState } from 'react';
import { useWrangle } from '../../context/WrangleContext';
import { Sel, ConfirmModal } from '../ui';

const TX_TABS = [
  { id: 'clean', label: '🧹 Clean' },
  { id: 'text', label: '✏️ Text' },
  { id: 'columns', label: '⚙️ Columns' },
  { id: 'filter', label: '🔍 Filter Rows' },
];

export default function TransformPanel() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const {
    activeTxTab,
    setActiveTxTab,
    columns,
    dataTypes,
    removeDuplicates,
    trimWhitespace,
    missingCol,
    setMissingCol,
    missStrategy,
    setMissStrategy,
    handleMissing,
    normalizeCol,
    setNormalizeCol,
    textFmt,
    setTextFmt,
    normalizeText,
    dateCol,
    setDateCol,
    convertDate,
    frCol,
    setFrCol,
    findVal,
    setFindVal,
    replaceVal,
    setReplaceVal,
    findReplace,
    typeCol,
    setTypeCol,
    targetType,
    setTargetType,
    changeType,
    renameFrom,
    setRenameFrom,
    renameTo,
    setRenameTo,
    renameColumn,
    delCol,
    setDelCol,
    deleteColumn,
    filterCol,
    setFilterCol,
    filterOp,
    setFilterOp,
    filterVal,
    setFilterVal,
    applyRowFilter,
  } = useWrangle();

  return (
    <div className="card overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-x-auto">
        {TX_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTxTab(t.id)}
            className={`tab ${activeTxTab === t.id ? 'tab-active' : 'tab-inactive'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* ── Clean ── */}
        {activeTxTab === 'clean' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={removeDuplicates}
              className="btn-slate h-full min-h-[4rem] flex-col gap-1"
            >
              <span className="text-lg">🗑</span> Remove Duplicates
            </button>
            <button
              onClick={trimWhitespace}
              className="btn-slate h-full min-h-[4rem] flex-col gap-1"
            >
              <span className="text-lg">✂️</span> Trim Whitespace
            </button>
            <div className="transform-card">
              <p className="transform-label">Handle Missing Values</p>
              <Sel
                value={missingCol}
                onChange={setMissingCol}
                options={columns}
                placeholder="Choose Column"
              />
              <Sel
                value={missStrategy}
                onChange={setMissStrategy}
                objArr
                options={[
                  { v: 'drop', l: 'Drop Rows' },
                  { v: 'mean', l: 'Fill Mean' },
                  { v: 'median', l: 'Fill Median' },
                ]}
              />
              <button
                onClick={handleMissing}
                disabled={!missingCol}
                className="btn-emerald w-full"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* ── Text ── */}
        {activeTxTab === 'text' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="transform-card">
              <p className="transform-label">Normalize Text</p>
              <Sel
                value={normalizeCol}
                onChange={setNormalizeCol}
                options={columns}
                placeholder="Choose Column"
              />
              <Sel
                value={textFmt}
                onChange={setTextFmt}
                objArr
                options={[
                  { v: 'lowercase', l: 'lowercase' },
                  { v: 'uppercase', l: 'UPPERCASE' },
                  { v: 'titlecase', l: 'Title Case' },
                ]}
              />
              <button
                onClick={normalizeText}
                disabled={!normalizeCol}
                className="btn-amber w-full"
              >
                Apply
              </button>
            </div>
            <div className="transform-card">
              <p className="transform-label">Convert Date → ISO 8601</p>
              <Sel
                value={dateCol}
                onChange={setDateCol}
                options={columns}
                placeholder="Choose Column"
              />
              <button
                onClick={convertDate}
                disabled={!dateCol}
                className="btn-blue w-full"
              >
                Convert
              </button>
            </div>
            <div className="transform-card">
              <p className="transform-label">Find & Replace</p>
              <Sel
                value={frCol}
                onChange={setFrCol}
                options={columns}
                placeholder="Choose Column"
              />
              <input
                value={findVal}
                onChange={(e) => setFindVal(e.target.value)}
                placeholder="Find exact value"
                className="input w-full"
              />
              <input
                value={replaceVal}
                onChange={(e) => setReplaceVal(e.target.value)}
                placeholder="Replace with"
                className="input w-full"
              />
              <button
                onClick={findReplace}
                disabled={!frCol || findVal === ''}
                className="btn-violet w-full"
              >
                Replace All
              </button>
            </div>
            <div className="transform-card">
              <p className="transform-label">Change Data Type</p>
              <Sel
                value={typeCol}
                onChange={setTypeCol}
                objArr
                options={columns.map((c) => ({ v: c, l: `${c} (${dataTypes[c]})` }))}
                placeholder="Choose Column"
              />
              <Sel
                value={targetType}
                onChange={setTargetType}
                objArr
                options={[
                  { v: 'string', l: 'string' },
                  { v: 'number', l: 'number' },
                  { v: 'date', l: 'date' },
                ]}
              />
              <button
                onClick={changeType}
                disabled={!typeCol}
                className="btn-violet w-full"
              >
                Convert
              </button>
            </div>
          </div>
        )}

        {/* ── Columns ── */}
        {activeTxTab === 'columns' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="transform-card">
              <p className="transform-label">Rename Column</p>
              <Sel
                value={renameFrom}
                onChange={setRenameFrom}
                options={columns}
                placeholder="Select Column"
              />
              <input
                value={renameTo}
                onChange={(e) => setRenameTo(e.target.value)}
                placeholder="New name"
                className="input w-full"
              />
              <button
                onClick={renameColumn}
                disabled={!renameFrom || !renameTo}
                className="btn-pink w-full"
              >
                Rename
              </button>
            </div>
            <div className="transform-card">
              <p className="transform-label">Delete Column</p>
              <Sel
                value={delCol}
                onChange={setDelCol}
                options={columns}
                placeholder="Choose Column"
              />
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={!delCol}
                className="btn-red w-full"
              >
                ⚠️ Delete Column
              </button>
            </div>
          </div>
        )}

        {/* ── Filter Rows ── */}
        {activeTxTab === 'filter' && (
          <div className="space-y-3 max-w-2xl">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Permanently filters rows from the dataset (use Undo to revert).
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Sel
                value={filterCol}
                onChange={setFilterCol}
                options={columns}
                placeholder="Column"
              />
              <Sel
                value={filterOp}
                onChange={setFilterOp}
                objArr
                options={[
                  { v: 'contains', l: 'contains' },
                  { v: 'equals', l: '= equals' },
                  { v: 'not_equals', l: '≠ not equals' },
                  { v: 'starts_with', l: 'starts with' },
                  { v: 'gt', l: '> greater' },
                  { v: 'lt', l: '< less' },
                  { v: 'gte', l: '≥ ≥ value' },
                  { v: 'lte', l: '≤ ≤ value' },
                ]}
              />
              <input
                value={filterVal}
                onChange={(e) => setFilterVal(e.target.value)}
                placeholder="Value"
                className="input"
              />
            </div>
            <button
              onClick={applyRowFilter}
              disabled={!filterCol || filterVal === ''}
              className="btn-indigo"
            >
              Apply Filter
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={deleteColumn}
        title="Hapus Kolom?"
        message={`Apakah Anda yakin ingin menghapus kolom "${delCol}"? Anda dapat membatalkannya nanti menggunakan fitur Undo.`}
      />
    </div>
  );
}
