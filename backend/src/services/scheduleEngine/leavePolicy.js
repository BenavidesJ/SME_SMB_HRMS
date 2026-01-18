import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { parseToTz, toMinuteOfDay, toDayIndex } from "./timeAdapter.js";
import { getDayContext } from "./dayContext.js";
import { validateLeaveByDateRange } from "./leavesByDateRange.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function minutesOverlap(aStart, aEnd, bStart, bEnd) {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}

function sumOverlapWithWindows(rangeStartMin, rangeEndMin, windows) {
  let total = 0;
  for (const w of windows || []) {
    total += minutesOverlap(rangeStartMin, rangeEndMin, w.start, w.end);
  }
  return total;
}

function isMinuteInsideRanges(minute, ranges) {
  if (!Array.isArray(ranges)) return false;
  return ranges.some((r) => minute >= r.start && minute < r.end);
}

/**
 * Calcula duración (en minutos) del "permiso efectivo" basado en ventanas virtuales:
 * - Si es un solo día: overlap exacto del intervalo con ventanas (y debe cubrir 100% del intervalo).
 * - Si es multi-día: sumatoria:
 *   - Día 1: overlap desde startMin hasta 1440
 *   - Días intermedios: overlap de 0..1440
 *   - Último día: overlap 0..endMin
 */
function computeLeaveMinutesAcrossWindows({
  startTs,
  endTs,
  startDateStr,
  endDateStr,
  effectiveDates,
  template,
}) {
  const tz = template.timezone || "America/Costa_Rica";

  const start = parseToTz(startTs, tz);
  const end = parseToTz(endTs, tz);

  const startMin = toMinuteOfDay(start, tz);
  const endMin = toMinuteOfDay(end, tz);

  const sameDay = startDateStr === endDateStr;

  const windowsForDate = (dateStr) => {
    const dayIndex = toDayIndex(`${dateStr} 12:00:00`, tz);
    return template.virtualWindowsByDay?.[dayIndex] || [];
  };

  if (sameDay) {
    const windows = windowsForDate(startDateStr);
    const intervalLen = Math.max(0, endMin - startMin);
    const covered = sumOverlapWithWindows(startMin, endMin, windows);
    if (covered !== intervalLen) return { ok: false, minutes: 0 };
    return { ok: true, minutes: covered };
  }

  let total = 0;

  {
    const windows = windowsForDate(startDateStr);
    total += sumOverlapWithWindows(startMin, 1440, windows);
  }

  for (const dateStr of effectiveDates) {
    if (dateStr === startDateStr || dateStr === endDateStr) continue;
    const windows = windowsForDate(dateStr);
    total += sumOverlapWithWindows(0, 1440, windows);
  }

  {
    const windows = windowsForDate(endDateStr);
    total += sumOverlapWithWindows(0, endMin, windows);
  }

  return { ok: true, minutes: total };
}

/**
 * Valida y calcula cantidades de una solicitud de permiso/licencia (DATETIME).
 *
 * @returns {{
 *   allowed: boolean,
 *   violations: Array,
 *   effectiveDates: string[],
 *   cantidad_horas: number,
 *   cantidad_dias: number
 * }}
 */
export function validateLeaveRequest({
  fecha_inicio,
  fecha_fin,
  template,
  holidaysMap,
  todayDate = null,
}) {
  if (!template) throw new Error("validateLeaveRequest: template es requerido");

  const tz = template.timezone || "America/Costa_Rica";

  const start = parseToTz(fecha_inicio, tz);
  const end = parseToTz(fecha_fin, tz);

  if (!start.isValid() || !end.isValid()) {
    return {
      allowed: false,
      violations: [{ code: "INVALID_DATETIME", message: "fecha_inicio/fecha_fin inválidas" }],
      effectiveDates: [],
      cantidad_horas: 0,
      cantidad_dias: 0,
    };
  }
  if (!end.isAfter(start)) {
    return {
      allowed: false,
      violations: [{ code: "END_BEFORE_START", message: "fecha_fin debe ser mayor que fecha_inicio" }],
      effectiveDates: [],
      cantidad_horas: 0,
      cantidad_dias: 0,
    };
  }

  const startDateStr = start.format("YYYY-MM-DD");
  const endDateStr = end.format("YYYY-MM-DD");

  const byDates = validateLeaveByDateRange({
    startDate: startDateStr,
    endDate: endDateStr,
    template,
    holidaysMap,
    todayDate,
  });

  if (!byDates.allowed) {
    return {
      allowed: false,
      violations: byDates.violations,
      effectiveDates: [],
      cantidad_horas: 0,
      cantidad_dias: 0,
    };
  }

  const effectiveDates = byDates.effectiveDates;

  const startCtx = getDayContext({ dateStr: startDateStr, template, holidaysMap });
  const endCtx = getDayContext({ dateStr: endDateStr, template, holidaysMap });

  const startDayWindows = template.virtualWindowsByDay?.[startCtx.dayIndex] || [];
  const endDayWindows = template.virtualWindowsByDay?.[endCtx.dayIndex] || [];

  const startMin = toMinuteOfDay(start, tz);
  const endMin = toMinuteOfDay(end, tz);

  const violations = [];

  if (startDateStr === endDateStr) {
    const intervalLen = Math.max(0, endMin - startMin);
    const covered = sumOverlapWithWindows(startMin, endMin, startDayWindows);

    if (covered !== intervalLen) {
      violations.push({
        code: "OUTSIDE_VIRTUAL_WINDOW",
        date: startDateStr,
        message: "El rango horario del permiso debe caer completamente dentro de la ventana virtual.",
      });
    }
  } else {
    if (!isMinuteInsideRanges(startMin, startDayWindows)) {
      violations.push({
        code: "OUTSIDE_VIRTUAL_WINDOW_START",
        date: startDateStr,
        message: "La hora de inicio debe estar dentro de la ventana virtual del día de inicio.",
      });
    }
    if (!isMinuteInsideRanges(endMin, endDayWindows)) {
      violations.push({
        code: "OUTSIDE_VIRTUAL_WINDOW_END",
        date: endDateStr,
        message: "La hora de fin debe estar dentro de la ventana virtual del día de finalización.",
      });
    }
  }

  if (violations.length) {
    return {
      allowed: false,
      violations,
      effectiveDates: [],
      cantidad_horas: 0,
      cantidad_dias: 0,
    };
  }

  const computed = computeLeaveMinutesAcrossWindows({
    startTs: fecha_inicio,
    endTs: fecha_fin,
    startDateStr,
    endDateStr,
    effectiveDates,
    template,
  });

  if (!computed.ok) {
    return {
      allowed: false,
      violations: [{
        code: "OUTSIDE_VIRTUAL_WINDOW",
        message: "El rango horario del permiso no coincide con las ventanas virtuales del contrato.",
      }],
      effectiveDates: [],
      cantidad_horas: 0,
      cantidad_dias: 0,
    };
  }

  const cantidad_horas = round2(computed.minutes / 60);
  const cantidad_dias = effectiveDates.length;

  return {
    allowed: true,
    violations: [],
    effectiveDates,
    cantidad_horas,
    cantidad_dias,
  };
}
