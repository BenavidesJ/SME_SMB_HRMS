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

  const date = parseIsoLikeDate(dateValue);
  if (!date) return "";

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

  const dateOnlyRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T/;

  const dateOnlyMatch = value.match(dateOnlyRegex);

  if (!dateOnlyMatch && !dateTimeRegex.test(value)) return null;

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);

    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return null;
    }

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const candidate = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (
      candidate.getFullYear() !== year
      || candidate.getMonth() !== month - 1
      || candidate.getDate() !== day
    ) {
      return null;
    }

    return candidate;
  }

  const candidate = new Date(value);

  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function formatDateParts(
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  // eslint-disable-next-line no-unused-vars
  formatter: (dateParts: Intl.DateTimeFormatPart[]) => string,
  fallback = "—",
): string {
  const parsed = parseIsoLikeDate(value);
  if (!parsed) return value ?? fallback;

  const parts = new Intl.DateTimeFormat("es-CR", options).formatToParts(parsed);
  const formatted = formatter(parts);
  return formatted || value || fallback;
}

export function formatDateUiDefault(value?: string | null): string {
  return formatDateParts(
    value,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    (parts) => {
      const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
      const day = parts.find((part) => part.type === "day")?.value ?? "";
      const month = parts.find((part) => part.type === "month")?.value ?? "";
      const year = parts.find((part) => part.type === "year")?.value ?? "";

      if (!weekday || !day || !month || !year) return "";
      return `${weekday} ${day} ${capitalize(month)} ${year}`;
    },
  );
}

export function formatDateUiCompact(value?: string | null): string {
  return formatDateParts(
    value,
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
    (parts) => {
      const day = parts.find((part) => part.type === "day")?.value ?? "";
      const month = parts.find((part) => part.type === "month")?.value ?? "";
      const year = parts.find((part) => part.type === "year")?.value ?? "";

      if (!day || !month || !year) return "";
      return `${day} ${capitalize(month)} ${year}`;
    },
  );
}

export function formatDateRangeUi(start?: string | null, end?: string | null): string {
  const formattedStart = formatDateUiCompact(start);
  const formattedEnd = formatDateUiCompact(end);

  if (!start && !end) return "—";
  if (!start) return formattedEnd;
  if (!end) return formattedStart;

  return `${formattedStart} - ${formattedEnd}`;
}

export function formatDateTimeUi(value?: string | null): string {
  return formatDateParts(
    value,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
    (parts) => {
      const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
      const day = parts.find((part) => part.type === "day")?.value ?? "";
      const month = parts.find((part) => part.type === "month")?.value ?? "";
      const year = parts.find((part) => part.type === "year")?.value ?? "";
      const hour = parts.find((part) => part.type === "hour")?.value ?? "";
      const minute = parts.find((part) => part.type === "minute")?.value ?? "";
      const dayPeriod = parts.find((part) => part.type === "dayPeriod")?.value ?? "";

      if (!weekday || !day || !month || !year || !hour || !minute) return "";

      const periodText = dayPeriod ? ` ${dayPeriod}` : "";
      return `${weekday} ${day} ${capitalize(month)} ${year} ${hour}:${minute}${periodText}`;
    },
  );
}

export function parseUiDateSafe(value?: string | null): Date | null {
  return parseIsoLikeDate(value);
}

export function formatSpanishLongDate(value?: string | null): string {
  return formatDateParts(
    value,
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
    (parts) => {
      const day = parts.find((part) => part.type === "day")?.value ?? "";
      const month = parts.find((part) => part.type === "month")?.value ?? "";
      const year = parts.find((part) => part.type === "year")?.value ?? "";

      if (!day || !month || !year) return "";
      return `${day} de ${capitalize(month)} ${year}`;
    },
  );
}
