export type CalendarQueryParams = {
  from?: string;
  to?: string;
};

export function buildCalendarEventsUrl(params: CalendarQueryParams = {}) {
  const searchParams = new URLSearchParams();

  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);

  const qs = searchParams.toString();
  return qs ? `/calendario/eventos?${qs}` : "/calendario/eventos";
}
