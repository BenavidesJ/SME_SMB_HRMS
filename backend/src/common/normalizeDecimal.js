/**
 * Normaliza un valor para columnas DECIMAL(p,s)
 * Retorna STRING (correcto para Sequelize/MySQL)
 *
 * @param {string|number} value
 * @param {Object} options
 * @param {number} options.precision - Total de dígitos (p)
 * @param {number} options.scale - Decimales (s)
 * @param {string} [options.fieldName="valor"]
 */
export function normalizeDecimal(
  value,
  { precision, scale, fieldName = "valor" }
) {
  if (precision == null || scale == null) {
    throw new Error("precision y scale son requeridos");
  }

  if (value === null || value === undefined || value === "") {
    throw new Error(`${fieldName} es requerido`);
  }

  // Normalizar coma decimal
  const normalized = String(value).trim().replace(",", ".");
  const num = Number(normalized);

  if (!Number.isFinite(num)) {
    throw new Error(`${fieldName} debe ser numérico`);
  }

  // Redondeo exacto a 'scale'
  const fixed = num.toFixed(scale);

  const [intPart, decPart] = fixed.split(".");

  // Validar parte entera (p - s)
  const maxIntegerDigits = precision - scale;
  if (intPart.replace("-", "").length > maxIntegerDigits) {
    throw new Error(
      `${fieldName} excede el máximo permitido para DECIMAL(${precision},${scale})`
    );
  }

  // Validar parte decimal exacta
  if (decPart && decPart.length !== scale) {
    throw new Error(
      `${fieldName} debe tener exactamente ${scale} decimales`
    );
  }

  return fixed;
}
