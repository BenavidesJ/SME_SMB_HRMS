import { useCallback, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DATE_FMT, formatRangeLabel, getWeekRangeSundayToSaturday, now } from "../lib/fechas/dates"

export function useWeekPager(initial?: Dayjs) {
  const [ancho, setAncho] = useState<Dayjs>(() => initial ?? now());

  const range = useMemo(() => getWeekRangeSundayToSaturday(ancho), [ancho]);

  const desde = useMemo(() => range.start.format(DATE_FMT), [range.start]);
  const hasta = useMemo(() => range.end.format(DATE_FMT), [range.end]);

  const label = useMemo(() => formatRangeLabel(range), [range]);

  const goPrevWeek = useCallback(() => setAncho((d) => d.subtract(7, "day")), []);
  const goNextWeek = useCallback(() => setAncho((d) => d.add(7, "day")), []);
  const goToday = useCallback(() => setAncho(now()), []);

  const setWeekContaining = useCallback((date: string | Date) => {
    setAncho(dayjs(date));
  }, []);

  return {
    ancho,
    range,
    desde,
    hasta,
    label,
    goPrevWeek,
    goNextWeek,
    goToday,
    setWeekContaining,
  };
}
