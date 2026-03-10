import dayjs, { Dayjs } from "dayjs";

export const DATE_FMT = "YYYY-MM-DD";
export const COSTA_RICA_TIMEZONE = "America/Costa_Rica";

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

export function getMaxBirthDateForLegalAge(minAge = 18): string {
  return dayjs().subtract(minAge, "year").format(DATE_FMT);
}

export function getCostaRicaTodayDate(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COSTA_RICA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
}

export function addDaysToDateInput(dateValue: string, daysToAdd: number): string {
  if (!dateValue) return "";

  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  date.setDate(date.getDate() + daysToAdd);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function parseIsoLikeDate(value?: string | null): Date | null {
  if (!value) return null;

  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T/;

  if (!dateOnlyRegex.test(value) && !dateTimeRegex.test(value)) return null;

  const candidate = dateOnlyRegex.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

export function formatSpanishLongDate(value?: string | null): string {
  const parsed = parseIsoLikeDate(value);
  if (!parsed) return value ?? "—";

  const parts = new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).formatToParts(parsed);

  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const year = parts.find((part) => part.type === "year")?.value ?? "";

  if (!day || !month || !year) return value ?? "—";
  return `${day} de ${capitalize(month)} ${year}`;
}
