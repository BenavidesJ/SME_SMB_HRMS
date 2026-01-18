import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Convierte un DATEONLY inclusivo (YYYY-MM-DD .. YYYY-MM-DD) en un intervalo half-open:
 * [startOfDay(startDate), startOfDay(endDate + 1)]
 *
 */
export function toHalfOpenDateInterval({ startDate, endDate, tz = "America/Costa_Rica" }) {
  const start = dayjs.tz(startDate, tz).startOf("day");
  const endInclusive = dayjs.tz(endDate, tz).startOf("day");

  if (!start.isValid() || !endInclusive.isValid()) {
    throw new Error("toHalfOpenDateInterval: invalid date(s)");
  }
  if (start.isAfter(endInclusive)) {
    throw new Error("toHalfOpenDateInterval: startDate must be <= endDate");
  }

  const endExclusive = endInclusive.add(1, "day");
  return {
    start,        // dayjs
    endExclusive, // dayjs
  };
}

/**
 * Overlap entre intervalos half-open:
 */
export function halfOpenIntervalsOverlap(a, b) {
  return a.start.isBefore(b.endExclusive) && b.start.isBefore(a.endExclusive);
}

export function rangesOverlap({ aStart, aEnd, bStart, bEnd, tz = "America/Costa_Rica" }) {
  const A = toHalfOpenDateInterval({ startDate: aStart, endDate: aEnd, tz });
  const B = toHalfOpenDateInterval({ startDate: bStart, endDate: bEnd, tz });
  return halfOpenIntervalsOverlap(A, B);
}
