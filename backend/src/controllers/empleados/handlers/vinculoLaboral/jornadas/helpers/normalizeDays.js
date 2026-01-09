export const normalizeDays = (value, fieldName, { defaultValue } = {}) => {
  const raw =
    value === undefined || value === null || String(value).trim() === ""
      ? defaultValue
      : String(value).trim();

  if (!raw || String(raw).trim() === "") {
    throw new Error(`El campo ${fieldName} es obligatorio`);
  }

  const cleaned = raw.toUpperCase().replace(/[\s,\-_/|]+/g, "");

  const allowed = new Set(["L", "K", "M", "J", "V", "S", "D"]);
  for (const ch of cleaned) {
    if (!allowed.has(ch)) {
      throw new Error(
        `${fieldName} contiene un día inválido (${ch}). Use solo L,K,M,J,V,S,D`
      );
    }
  }

  const unique = [];
  const seen = new Set();
  for (const ch of cleaned) {
    if (!seen.has(ch)) {
      seen.add(ch);
      unique.push(ch);
    }
  }

  const normalized = unique.join("");
  if (normalized.length > 12) {
    throw new Error(`${fieldName} excede el máximo de caracteres (12)`);
  }

  return normalized;
};