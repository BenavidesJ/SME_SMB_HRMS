import dayjs, { Dayjs } from "dayjs";

export const DATE_FMT = "YYYY-MM-DD";

export function now(): Dayjs {
  return dayjs();
}

export type WeekRange = {
  start: Dayjs; // domingo 00:00
  end: Dayjs;   // sábado 23:59:59.999
};

export function getWeekRangeSundayToSaturday(date: Dayjs): WeekRange {
  const start = date.day(0).startOf("day");
  const end = start.add(6, "day").endOf("day");
  return { start, end };
}

export function formatRangeLabel(range: WeekRange) {
  return `${range.start.format("DD MMM YYYY")} - ${range.end.format("DD MMM YYYY")}`;
}
