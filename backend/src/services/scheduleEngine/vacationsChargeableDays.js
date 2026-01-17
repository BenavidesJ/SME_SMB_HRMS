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
 * Flujo A:
 * - Solo descuentan saldo los días laborables (según template) que NO son feriados.
 * - Descanso (S/D) no descuenta.
 */
export function computeChargeableVacationDays({ startDate, endDate, template, holidaysMap }) {
  if (!template) throw new Error("computeChargeableVacationDays: template is required");
  const tz = template.timezone || "America/Costa_Rica";

  const chargeableDates = [];
  const skippedDates = [];

  for (const dateStr of iterateDatesInclusive(startDate, endDate, tz)) {
    const ctx = getDayContext({ dateStr, template, holidaysMap });

    // No laborable (incluye descanso)
    if (!ctx.isWorkday) {
      skippedDates.push({
        date: dateStr,
        reason: ctx.isRestDay ? "REST_DAY" : "NON_WORKDAY",
      });
      continue;
    }

    // Feriado
    if (ctx.isHoliday) {
      skippedDates.push({
        date: dateStr,
        reason: "HOLIDAY",
        holiday: ctx.holidayInfo?.nombre ?? null,
      });
      continue;
    }

    chargeableDates.push(dateStr);
  }

  return {
    chargeableDates,
    skippedDates,
    chargeableDays: chargeableDates.length,
  };
}
