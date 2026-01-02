export const normalizeTime = (value, fieldName) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`El campo ${fieldName} es obligatorio`);
  }

  const raw = String(value).trim();
  const m = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!m) throw new Error(`${fieldName} debe tener formato HH:mm o HH:mm:ss`);

  const hh = m[1];
  const mm = m[2];
  const ss = m[3] ?? "00";
  return `${hh}:${mm}:${ss}`;
};