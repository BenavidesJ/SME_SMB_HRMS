import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const CR_TZ = "America/Costa_Rica";

/**
 * Convierte fechas a formato CR
 *
 * @param {string|Date} date - Fecha en formato Date o string (ISO, SQL, etc.)
 * @param {string} format - Formato de salida (default: "YYYY-MM-DD HH:mm:ss")
 * @returns {string} Fecha formateada
 */
export function parseToCostaRica(date, format = "DD-MM-YYYY HH:mm:ss") {
  if (!date) return null;

  const d = dayjs(date);

  const hasTime = /[T\s]\d{2}:\d{2}/.test(date.toString());

  if (hasTime) {
    return dayjs.utc(date).tz(CR_TZ).format(format);
  } else {
    return d.format("DD-MM-YYYY");
  }
}
