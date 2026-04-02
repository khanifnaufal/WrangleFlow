export function Sel({ value, onChange, options, placeholder, objArr = false }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="input w-full">
      {placeholder && <option value="">{placeholder}</option>}
      {objArr
        ? options.map((o) => (
            <option key={o.v} value={o.v}>
              {o.l}
            </option>
          ))
        : options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
    </select>
  );
}

export function TypeBadge({ type }) {
  const cls =
    type === 'number'
      ? 'badge-number'
      : type === 'date'
      ? 'badge-date'
      : 'badge-string';
  return <span className={cls}>{type}</span>;
}

export function StatRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs py-0.5">
      <span className="text-slate-400 dark:text-slate-500 capitalize">{label}</span>
      <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
        {String(value)}
      </span>
    </div>
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-ghost">Batal</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="btn-red">Hapus</button>
        </div>
      </div>
    </div>
  );
}
