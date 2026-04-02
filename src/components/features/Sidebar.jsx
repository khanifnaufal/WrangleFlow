import { useWrangle } from '../../context/WrangleContext';
import { TypeBadge, StatRow } from '../ui';

export default function Sidebar() {
  const {
    columns,
    statsCol,
    setStatsCol,
    dataTypes,
    colStats,
    projectName,
    setProjectName,
    exportFile,
    data,
    pipeline,
  } = useWrangle();

  return (
    <div className="space-y-4">
      {/* Column Explorer */}
      <div className="card p-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          📈 Column Explorer
        </h2>
        <ul className="space-y-0.5 max-h-56 overflow-y-auto pr-1">
          {columns.map((col) => (
            <li key={col}>
              <button
                onClick={() => setStatsCol((s) => (s === col ? '' : col))}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors gap-1
                  ${
                    statsCol === col
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
              >
                <span className="font-mono truncate">{col}</span>
                <TypeBadge type={dataTypes[col]} />
              </button>
            </li>
          ))}
        </ul>
        {colStats && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 font-mono truncate">
              {statsCol}
            </p>
            {Object.entries(colStats).map(([k, v]) => (
              <StatRow key={k} label={k.replace(/_/g, ' ')} value={v} />
            ))}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="card p-4 space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">📤 Export</h2>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="File name"
          className="input w-full text-xs"
        />
        <button
          onClick={() => exportFile('csv')}
          disabled={!data.length}
          className="btn-slate w-full text-xs"
        >
          Export CSV
        </button>
        <button
          onClick={() => exportFile('json')}
          disabled={!data.length}
          className="btn-indigo w-full text-xs"
        >
          Export JSON
        </button>
      </div>

      {/* Pipeline Log */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            🔁 Pipeline Log
          </h2>
          <span className="text-xs text-slate-400 dark:text-slate-600">{pipeline.length} steps</span>
        </div>
        <ul className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {pipeline.length === 0 && <li className="text-xs text-slate-400">No steps yet.</li>}
          {pipeline.map((step, i) => (
            <li
              key={`${step.at}-${i}`}
              className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2 text-xs"
            >
              <div className="text-slate-700 dark:text-slate-200">{step.description}</div>
              <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                {new Date(step.at).toLocaleTimeString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
