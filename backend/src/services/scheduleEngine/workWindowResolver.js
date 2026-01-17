import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { parseToTz } from "./timeAdapter.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function toMinutes(hhmmss) {
  const [h, m] = String(hhmmss).split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Devuelve el rango de "ventana de jornada" donde deben caer ENTRADA y SALIDA.
 *
 * @param {Object} params
 * @param {Date|string} params.timestamp
 * @param {Object} params.template
 * @returns {{ windowStart: any, windowEnd: any, windowDateStr: string }}
 */
export function resolveWorkWindowForTimestamp({ timestamp, template }) {
  if (!template) throw new Error("resolveWorkWindowForTimestamp: template is required");
  const tz = template.timezone || "America/Costa_Rica";

  const ts = parseToTz(timestamp, tz);
  if (!ts.isValid()) throw new Error("resolveWorkWindowForTimestamp: invalid timestamp");

  const dateStr = ts.format("YYYY-MM-DD");
  const startMin = toMinutes(template.hora_inicio);
  const endMin = toMinutes(template.hora_fin);

  if (startMin < endMin) {
    const windowStart = dayjs.tz(dateStr, tz).startOf("day");
    const windowEnd = dayjs.tz(dateStr, tz).endOf("day");
    return { windowStart, windowEnd, windowDateStr: dateStr };
  }

  const minuteOfDay = ts.hour() * 60 + ts.minute();

  if (minuteOfDay <= endMin) {
    const prevDateStr = ts.subtract(1, "day").format("YYYY-MM-DD");
    const windowStart = dayjs.tz(prevDateStr, tz).startOf("day");
    const windowEnd = dayjs.tz(dateStr, tz).endOf("day");
    return { windowStart, windowEnd, windowDateStr: prevDateStr };
  }

  const windowStart = dayjs.tz(dateStr, tz).startOf("day");
  const nextDateStr = ts.add(1, "day").format("YYYY-MM-DD");
  const windowEnd = dayjs.tz(nextDateStr, tz).endOf("day");
  return { windowStart, windowEnd, windowDateStr: dateStr };
}
