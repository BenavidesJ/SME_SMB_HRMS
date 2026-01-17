import { toDayIndex } from "./timeAdapter.js";

/**
 * DayContext conecta "reglas semanales" (template) con "fechas específicas" (feriados).
 *
 * holidaysMap: Map<"YYYY-MM-DD", { nombre: string, es_obligatorio: boolean|number }>
 */
export function getDayContext({ dateStr, template, holidaysMap }) {
  if (!dateStr || typeof dateStr !== "string") {
    throw new Error("getDayContext: el formato de dateStr debe cumplir YYYY-MM-DD");
  }
  if (!template) {
    throw new Error("getDayContext: el template es requerido");
  }

  const tz = template.timezone || "America/Costa_Rica";
  const dayIndex = toDayIndex(`${dateStr} 12:00:00`, tz);

  const isHoliday = Boolean(holidaysMap?.has(dateStr));
  const holidayInfo = isHoliday ? holidaysMap.get(dateStr) : null;

  const isRestDay = Array.isArray(template.restDays) && template.restDays.includes(dayIndex);

  const virtualWindows = template.virtualWindowsByDay?.[dayIndex] || [];
  const hasVirtual = Array.isArray(virtualWindows) && virtualWindows.length > 0;

  const isWorkday = hasVirtual && !isRestDay;

  return {
    dateStr,
    dayIndex,
    isHoliday,
    holidayInfo,
    isRestDay,
    isWorkday,
  };
}
