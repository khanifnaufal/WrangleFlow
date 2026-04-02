import { useWrangle } from '../../context/WrangleContext';

export default function Header() {
  const { data, columns, history, future, clearAll, undo, redo, dark, setDark } = useWrangle();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 h-14 flex items-center gap-3">
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent tracking-tight">
          WrangleFlow
        </span>
        {data.length > 0 && (
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
            {data.length.toLocaleString()} rows × {columns.length} cols
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={undo}
            disabled={!history.length}
            title="Undo"
            className="btn-ghost text-lg disabled:opacity-25"
          >
            ↩
          </button>
          <button
            onClick={redo}
            disabled={!future.length}
            title="Redo"
            className="btn-ghost text-lg disabled:opacity-25"
          >
            ↪
          </button>
          {data.length > 0 && (
            <button
              onClick={clearAll}
              className="btn-ghost text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              ✕ Clear
            </button>
          )}
          <button
            onClick={() => setDark((d) => !d)}
            className="ml-1 p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Toggle dark mode"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
