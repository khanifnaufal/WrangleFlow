import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useWrangle } from '../../context/WrangleContext';
import { TypeBadge } from '../ui';

const MAIN_TABS = [
  { id: 'preview', label: '📊 Data Preview' },
  { id: 'quality', label: '🔬 Quality Report' },
];

export default function PreviewPanel() {
  const { activeMainTab, setActiveMainTab, data, columns, qualReport } = useWrangle();

  // ── Table state ──
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // ── Table config ──
  const tableCols = useMemo(
    () =>
      columns.map((col) => ({
        accessorKey: col,
        header: col,
        cell: (info) => (
          <div className="truncate max-w-xs" title={String(info.getValue() ?? '')}>
            {String(info.getValue() ?? '')}
          </div>
        ),
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: tableCols,
    state: { pagination: { pageIndex, pageSize }, sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: (v) => {
      setGlobalFilter(v);
      setPageIndex(0);
    },
    onPaginationChange: (upd) => {
      const n = typeof upd === 'function' ? upd({ pageIndex, pageSize }) : upd;
      setPageIndex(n.pageIndex);
      setPageSize(n.pageSize);
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 overflow-x-auto">
        {MAIN_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveMainTab(t.id)}
            className={`tab ${activeMainTab === t.id ? 'tab-active' : 'tab-inactive'}`}
          >
            {t.label}
          </button>
        ))}
        {activeMainTab === 'preview' && (
          <div className="ml-auto px-3 py-2 shrink-0">
            <input
              value={globalFilter}
              onChange={(e) => {
                setGlobalFilter(e.target.value);
                setPageIndex(0);
              }}
              placeholder="🔍 Search all columns…"
              className="input text-xs w-48"
            />
          </div>
        )}
      </div>

      <div className="p-4">
        {/* ── DATA PREVIEW ── */}
        {activeMainTab === 'preview' && (
          <>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((h) => (
                        <th
                          key={h.id}
                          onClick={h.column.getToggleSortingHandler()}
                          className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap cursor-pointer select-none hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            {flexRender(h.column.columnDef.header, h.getContext())}
                            <span className="text-slate-400 dark:text-slate-600 text-xs">
                              {{ asc: '↑', desc: '↓' }[h.column.getIsSorted()] ?? '↕'}
                            </span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((row, i) => (
                    <tr
                      key={row.id}
                      className={
                        i % 2 === 0
                          ? 'bg-white dark:bg-slate-900'
                          : 'bg-slate-50 dark:bg-slate-800/40'
                      }
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-3 py-2 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 max-w-[16rem]"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {table.getRowModel().rows.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="text-center py-8 text-slate-400">
                        No rows match the search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
              >
                ← Prev
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
              >
                Next →
              </button>
              <span className="text-xs">
                Page{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {table.getState().pagination.pageIndex + 1}
                </strong>{' '}
                /{' '}
                <strong className="text-slate-700 dark:text-slate-200">
                  {table.getPageCount()}
                </strong>
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-600">
                ({table.getFilteredRowModel().rows.length.toLocaleString()} rows filtered)
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageIndex(0);
                }}
                className="input text-xs ml-auto"
              >
                {[10, 20, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s} rows
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* ── QUALITY REPORT ── */}
        {activeMainTab === 'quality' && qualReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Total Rows', value: data.length.toLocaleString(), color: 'indigo' },
                { label: 'Columns', value: columns.length, color: 'violet' },
                {
                  label: 'Total Missing',
                  value: qualReport.reduce((s, r) => s + r.missing, 0).toLocaleString(),
                  color: 'rose',
                },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-4 text-center bg-${color}-50 dark:bg-${color}-950/30`}>
                  <div className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value}</div>
                  <div className={`text-xs text-${color}-500 dark:text-${color}-400 mt-1`}>{label}</div>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    {['Column', 'Type', 'Missing', 'Missing %', 'Unique', 'Flags'].map((h) => (
                      <th key={h} className="px-3 py-2.5 text-left border-b border-slate-200 dark:border-slate-700">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {qualReport.map((row, i) => (
                    <tr
                      key={row.col}
                      className={
                        i % 2 === 0
                          ? 'bg-white dark:bg-slate-900'
                          : 'bg-slate-50 dark:bg-slate-800/40'
                      }
                    >
                      <td className="px-3 py-2 font-mono text-xs font-medium text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800">
                        {row.col}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <TypeBadge type={row.type} />
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        {row.missing}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-rose-400 dark:bg-rose-500"
                              style={{ width: `${Math.min(row.missingPct, 100)}%` }}
                            />
                          </div>
                          <span className={row.missingPct > 20 ? 'text-rose-500 font-medium' : ''}>
                            {row.missingPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                        {row.unique.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 space-x-1">
                        {row.isId && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                            ID-like
                          </span>
                        )}
                        {row.missingPct > 50 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                            High missing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
