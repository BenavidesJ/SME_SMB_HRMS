import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { getDayContext } from "./dayContext.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function* iterateDatesInclusive(startDate, endDate, tz) {
  let cursor = dayjs.tz(startDate, tz).startOf("day");
  const end = dayjs.tz(endDate, tz).startOf("day");

  if (!cursor.isValid() || !end.isValid()) {
    throw new Error("iterateDatesInclusive: invalid date");
  }
  if (cursor.isAfter(end)) {
    throw new Error("iterateDatesInclusive: startDate must be <= endDate");
  }

  while (cursor.isSame(end) || cursor.isBefore(end)) {
    yield cursor.format("YYYY-MM-DD");
    cursor = cursor.add(1, "day");
  }
}

/**
 * Valida permisos/licencias basados en DATEONLY.
 *
 * @param {Object} params
 * @param {string} params.startDate - YYYY-MM-DD (inclusive)
 * @param {string} params.endDate - YYYY-MM-DD (inclusive)
 * @param {Object} params.template
 * @param {Map} params.holidaysMap
 * @param {string} [params.todayDate] - YYYY-MM-DD para bloquear pasado
 */
export function validateLeaveByDateRange({
  startDate,
  endDate,
  template,
  holidaysMap,
  todayDate = null,
}) {
  if (!template) throw new Error("validateLeaveByDateRange: el template es requerido");
  const tz = template.timezone || "America/Costa_Rica";

  const violations = [];
  const effectiveDates = [];

  const today = todayDate ? dayjs.tz(todayDate, tz).startOf("day") : null;

  for (const dateStr of iterateDatesInclusive(startDate, endDate, tz)) {
    const d = dayjs.tz(dateStr, tz).startOf("day");

    if (today && d.isBefore(today)) {
      violations.push({
        code: "PAST_DATE",
        date: dateStr,
        message: "No se permiten permisos en fechas pasadas.",
      });
      continue;
    }

    const ctx = getDayContext({ dateStr, template, holidaysMap });

    if (ctx.isHoliday) {
      violations.push({
        code: "HOLIDAY",
        date: dateStr,
        message: "No se permiten permisos en feriado.",
        holiday: ctx.holidayInfo?.nombre ?? null,
      });
      continue;
    }

    if (ctx.isRestDay) {
      violations.push({
        code: "REST_DAY",
        date: dateStr,
        message: "No se permiten permisos en día de descanso.",
      });
      continue;
    }

    if (!ctx.isWorkday) {
      violations.push({
        code: "NON_WORKDAY",
        date: dateStr,
        message: "El día no es laborable para este contrato.",
      });
      continue;
    }

    effectiveDates.push(dateStr);
  }

  const allowed = violations.length === 0;

  return {
    allowed,
    violations,
    effectiveDates,
  };
}
