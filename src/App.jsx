import { WrangleProvider, useWrangle } from './context/WrangleContext';
import Header from './components/layout/Header';
import FileUpload from './components/features/FileUpload';
import TransformPanel from './components/features/TransformPanel';
import PreviewPanel from './components/features/PreviewPanel';
import Sidebar from './components/features/Sidebar';
import './App.css';

function MainLayout() {
  const { data } = useWrangle();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Header />

      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 py-6 space-y-5">
        <FileUpload />

        {data.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">
            {/* ── LEFT COLUMN ── */}
            <div className="xl:col-span-3 space-y-5">
              <TransformPanel />
              <PreviewPanel />
            </div>

            {/* ── SIDEBAR ── */}
            <div>
              <Sidebar />
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {data.length === 0 && (
          <div className="text-center py-20 text-slate-400 dark:text-slate-600">
            <div className="text-7xl mb-4 select-none">📊</div>
            <p className="text-lg font-semibold text-slate-500 dark:text-slate-400">
              No data loaded yet
            </p>
            <p className="text-sm mt-1">Upload a CSV or JSON file above to get started</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
              {[
                'Remove Duplicates',
                'Handle Missing Values',
                'Sort & Filter',
                'Column Stats',
                'Quality Report',
                'Export CSV/JSON',
              ].map((f) => (
                <span
                  key={f}
                  className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WrangleProvider>
      <MainLayout />
    </WrangleProvider>
  );
}
