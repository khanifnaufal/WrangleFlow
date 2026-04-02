export const toTitleCase = (s) =>
  String(s).toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

export const detectColumnType = (values) => {
  const ne = values.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  if (!ne.length) return 'string';
  if (ne.every((v) => !Number.isNaN(Number(v)))) return 'number';
  if (ne.every((v) => !Number.isNaN(new Date(v).getTime()))) return 'date';
  return 'string';
};

export const detectDataTypes = (data, columns) => {
  const t = {};
  columns.forEach((c) => { t[c] = detectColumnType(data.map((r) => r[c])); });
  return t;
};

export const normalizeRow = (row, columns) => {
  const out = {};
  columns.forEach((k) => { out[k] = row[k] === undefined ? null : row[k]; });
  return out;
};

export const getColumnStats = (data, col, type) => {
  const vals = data.map((r) => r[col]);
  const ne = vals.filter((v) => v !== null && v !== undefined && String(v).trim() !== '');
  const missing = vals.length - ne.length;
  if (type === 'number') {
    const nums = ne.map(Number).filter((n) => !Number.isNaN(n));
    if (!nums.length) return { count: vals.length, missing };
    const sorted = [...nums].sort((a, b) => a - b);
    const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    const std = Math.sqrt(nums.reduce((s, v) => s + (v - mean) ** 2, 0) / nums.length);
    return { count: vals.length, missing, min: sorted[0], max: sorted[sorted.length - 1], mean: +mean.toFixed(3), median, std: +std.toFixed(3) };
  }
  if (type === 'date') {
    const dates = ne.map((v) => new Date(v)).filter((d) => !Number.isNaN(d.getTime())).sort((a, b) => a - b);
    return { count: vals.length, missing, earliest: dates[0]?.toLocaleDateString(), latest: dates[dates.length - 1]?.toLocaleDateString() };
  }
  const freq = {};
  ne.forEach((v) => { freq[String(v)] = (freq[String(v)] || 0) + 1; });
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  return { count: vals.length, missing, unique: Object.keys(freq).length, topValue: top ? `"${top[0]}" ×${top[1]}` : '-' };
};

export const buildQualityReport = (data, columns, dataTypes) =>
  columns.map((col) => {
    const vals = data.map((r) => r[col]);
    const missing = vals.filter((v) => v === null || v === undefined || String(v).trim() === '').length;
    const unique = new Set(vals.map((v) => String(v ?? ''))).size;
    return { col, type: dataTypes[col], missing, missingPct: +((missing / vals.length) * 100).toFixed(1), unique, isId: unique === vals.length && vals.length > 1 };
  });
