import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

/**
 * Normaliza una fecha a YYYY-MM-DD
 * Acepta: Date, ISO string, YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, etc.
 */
export function normalizeDateOnly(value, fieldName = "fecha") {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`El campo ${fieldName} es obligatorio`);
  }

  const formats = [
    "YYYY-MM-DD",
    "YYYY/MM/DD",
    "DD-MM-YYYY",
    "DD/MM/YYYY",
    "MM-DD-YYYY",
    "MM/DD/YYYY",
    "YYYY-MM-DDTHH:mm:ss.SSSZ",
    "YYYY-MM-DDTHH:mm:ssZ",
  ];

  const d = dayjs(value, formats, true);
  if (!d.isValid()) {
    throw new Error(`${fieldName} es inválida`);
  }

  return d.format("YYYY-MM-DD");
}
