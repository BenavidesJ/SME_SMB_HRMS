const BOOLEAN_TRUE = new Set(["1", "true", "t", "si", "sí", "y", "yes"]);
const BOOLEAN_FALSE = new Set(["0", "false", "f", "no", "n"]);

export function requirePositiveInt(value, fieldName = "id") {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) throw new Error(`El campo ${fieldName} debe ser un entero positivo`);
  return num;
}

export function optionalPositiveInt(value, fieldName) {
  if (value === undefined) return undefined;
  return requirePositiveInt(value, fieldName);
}

export function requireNonEmptyString(value, fieldName) {
  const str = String(value ?? "").trim();
  if (!str) throw new Error(`El campo ${fieldName} es obligatorio`);
  return str;
}

export function requireUppercaseString(value, fieldName) {
  return requireNonEmptyString(value, fieldName).toUpperCase();
}

export function optionalUppercaseString(value, fieldName) {
  if (value === undefined) return undefined;
  return requireUppercaseString(value, fieldName);
}

export function optionalString(value, fieldName) {
  if (value === undefined) return undefined;
  return requireNonEmptyString(value, fieldName);
}

export function requireDecimal(value, fieldName, { min } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) throw new Error(`El campo ${fieldName} debe ser numérico`);
  if (min !== undefined && num < min) throw new Error(`El campo ${fieldName} debe ser mayor o igual a ${min}`);
  return num;
}

export function optionalDecimal(value, fieldName, options) {
  if (value === undefined) return undefined;
  return requireDecimal(value, fieldName, options);
}

export function requireBoolean(value, fieldName) {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === 0) return Boolean(value);
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (BOOLEAN_TRUE.has(normalized)) return true;
    if (BOOLEAN_FALSE.has(normalized)) return false;
  }
  throw new Error(`El campo ${fieldName} debe ser booleano`);
}

export function optionalBoolean(value, fieldName) {
  if (value === undefined) return undefined;
  return requireBoolean(value, fieldName);
}

export function requireDateOnly(value, fieldName) {
  const str = requireNonEmptyString(value, fieldName);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) throw new Error(`El campo ${fieldName} debe tener formato YYYY-MM-DD`);
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) throw new Error(`El campo ${fieldName} no contiene una fecha válida`);
  return str;
}

export function optionalDateOnly(value, fieldName) {
  if (value === undefined) return undefined;
  return requireDateOnly(value, fieldName);
}

export function ensurePatchHasAllowedFields(patch, allowedFields) {
  const present = allowedFields.filter((field) => Object.prototype.hasOwnProperty.call(patch, field));
  if (present.length === 0) throw new Error("No hay campos para actualizar");
  return present;
}