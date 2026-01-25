import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { getDayContext } from "./dayContext.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function* iterateDatesInclusive(startDate, endDate, tz) {
  let cursor = dayjs.tz(startDate, tz).startOf("day");
  const end = dayjs.tz(endDate, tz).startOf("day");

  if (!cursor.isValid() || !end.isValid()) throw new Error("iterateDatesInclusive: invalid date");
  if (cursor.isAfter(end)) throw new Error("iterateDatesInclusive: startDate mdebe ser <= endDate");

  while (cursor.isSame(end) || cursor.isBefore(end)) {
    yield cursor.format("YYYY-MM-DD");
    cursor = cursor.add(1, "day");
  }
}

export function computeEffectiveWorkdaysInRange({
  startDate,
  endDate,
  template,
  holidaysMap,
}) {
  if (!template) throw new Error("computeEffectiveWorkdaysInRange: el template de horario es requerido");
  const tz = template.timezone || "America/Costa_Rica";

  const effectiveDates = [];
  const skippedDates = [];

  for (const dateStr of iterateDatesInclusive(startDate, endDate, tz)) {
    const ctx = getDayContext({ dateStr, template, holidaysMap });

    if (!ctx.isWorkday) {
      skippedDates.push({
        date: dateStr,
        reason: ctx.isRestDay ? "REST_DAY" : "NON_WORKDAY",
      });
      continue;
    }

    if (ctx.isHoliday) {
      skippedDates.push({
        date: dateStr,
        reason: "HOLIDAY",
        holiday: ctx.holidayInfo?.nombre ?? null,
      });
      continue;
    }

    effectiveDates.push(dateStr);
  }

  return {
    effectiveDates,
    skippedDates,
    effectiveWorkdays: effectiveDates.length,
  };
}
