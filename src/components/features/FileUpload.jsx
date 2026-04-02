import { useState } from 'react';
import { useWrangle } from '../../context/WrangleContext';

export default function FileUpload() {
  const { data, parseFile } = useWrangle();
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    parseFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById('wf-file-input').click()}
      className={`card cursor-pointer p-8 flex flex-col items-center justify-center gap-3 border-2 border-dashed transition-all duration-200
        ${
          dragOver
            ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
    >
      <div className="text-5xl">{dragOver ? '📂' : '📁'}</div>
      <div className="text-center">
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          {data.length
            ? 'Drop a new file to replace current dataset'
            : 'Drop a CSV or JSON file here'}
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          or click to browse &mdash; CSV and JSON supported
        </p>
      </div>
      <input
        id="wf-file-input"
        type="file"
        accept=".csv,.json"
        onChange={(e) => parseFile(e.target.files?.[0])}
        className="sr-only"
      />
    </div>
  );
}
