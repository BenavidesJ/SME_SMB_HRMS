import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import isoWeek from "dayjs/plugin/isoWeek.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);

/**
 * Determina si un string trae offset/Z de timezone.
 */
function hasOffsetOrZ(input) {
  if (typeof input !== "string") return false;
  return /([zZ]|[+-]\d{2}:\d{2})$/.test(input.trim());
}

/**
 * Normaliza cualquier entrada de fecha/hora a un dayjs en la zona tz.
 *
 * Acepta:
 * - string "YYYY-MM-DD HH:mm:ss"
 * - string ISO con offset
 * - Date
 * - dayjs
 */
export function parseToTz(input, tz) {
  if (!tz) throw new Error("parseToTz: tz es requerido");

  // instancia de dayjs
  if (dayjs.isDayjs(input)) {
    return input.tz(tz);
  }

  // instancia de Date
  if (input instanceof Date) {
    return dayjs(input).tz(tz);
  }

  // string
  if (typeof input === "string") {
    const s = input.trim();

    if (hasOffsetOrZ(s)) {
      const d = dayjs(s).tz(tz);
      if (!d.isValid()) throw new Error(`parseToTz: datetime inválido: ${input}`);
      return d;
    }

    // Interpreta como "hora local" en tz
    const d = dayjs.tz(s, tz);
    if (!d.isValid()) throw new Error(`parseToTz: datetime inválido: ${input}`);
    return d;
  }

  throw new Error("parseToTz: el tipo ingresado no esta soportado");
}

/**
 * 0=Lun..6=Dom (ISO weekday: Mon=1..Sun=7)
 */
export function toDayIndex(input, tz) {
  const d = parseToTz(input, tz);
  return d.isoWeekday() - 1;
}

export function toMinuteOfDay(input, tz) {
  const d = parseToTz(input, tz);
  return d.hour() * 60 + d.minute();
}

export function toDateStr(input, tz) {
  const d = parseToTz(input, tz);
  return d.format("YYYY-MM-DD");
}

/**
 * Split de intervalo [start, end) en segmentos por día local.
 * Devuelve array de:
 * {
 *   dateStr: "YYYY-MM-DD",
 *   dayIndex: 0..6,
 *   startMin: number,
 *   endMin: number
 * }
 */
export function splitByMidnight(startInput, endInput, tz) {
  const start = parseToTz(startInput, tz);
  const end = parseToTz(endInput, tz);

  if (!start.isBefore(end)) {
    throw new Error("splitByMidnight: start tiene que ser menor que end");
  }

  const out = [];
  let cursor = start;

  while (cursor.isBefore(end)) {
    const dayStart = cursor.startOf("day");
    const dayEnd = dayStart.add(1, "day");

    const segStart = cursor;
    const segEnd = end.isBefore(dayEnd) ? end : dayEnd;

    const dateStr = segStart.format("YYYY-MM-DD");
    const dayIndex = segStart.isoWeekday() - 1;

    const startMin = segStart.hour() * 60 + segStart.minute();
    const rawEndMin = segEnd.hour() * 60 + segEnd.minute();

    const endMin = segEnd.isSame(dayEnd) ? 1440 : rawEndMin;

    out.push({ dateStr, dayIndex, startMin, endMin });

    cursor = segEnd;
  }

  return out;
}
