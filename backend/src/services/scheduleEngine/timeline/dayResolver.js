import { getDayContext } from "../dayContext.js";
import { resolveEventTypeForDay } from "./timelinePrecedence.js";
import { TIMELINE_EVENT_TYPES } from "./timelineTypes.js";

/**
 * Resuelve un día específico a un dia de timeline.
 *
 * @param {Object} params
 * @param {string} params.dateStr 
 * @param {Object} params.template
 * @param {Map<string, {nombre: string, es_obligatorio: number}>} params.holidaysMap
 *
 * @param {Object|null} params.incapacityRow 
 * @param {Object|null} params.vacationRow   
 * @param {Object|null} params.leaveRow    
 * @param {Object|null} params.attendanceAgg 
 *
 * @returns {import("./timelineTypes.js").TimelineDay}
 */
export function resolveDay({
  dateStr,
  template,
  holidaysMap,

  incapacityRow = null,
  vacationRow = null,
  leaveRow = null,
  attendanceAgg = null,
}) {
  if (!dateStr) throw new Error("resolveDay: dateStr requerido");
  if (!template) throw new Error("resolveDay: template requerido");
  const ctx = getDayContext({ dateStr, template, holidaysMap });

  const hasIncapacity = Boolean(incapacityRow);
  const hasVacation = Boolean(vacationRow);
  const hasLeave = Boolean(leaveRow);
  const hasAttendance =
    Boolean(attendanceAgg) &&
    Number(attendanceAgg.workedMinutes || 0) > 0;

  const eventType = resolveEventTypeForDay({
    hasIncapacity,
    hasVacation,
    hasLeave,
    hasAttendance,
  });

  let payableByEmployer = false;

  if (eventType === TIMELINE_EVENT_TYPES.INCAPACIDAD) {
    if (ctx.isHoliday && ctx.holidayInfo?.es_obligatorio) {
      payableByEmployer = false;
    } else {
      payableByEmployer = ctx.isWorkday;
    }
  }

  if (eventType === TIMELINE_EVENT_TYPES.VACACIONES) {
    payableByEmployer = ctx.isWorkday && !ctx.isHoliday;
  }

  if (eventType === TIMELINE_EVENT_TYPES.PERMISO) {
    payableByEmployer = ctx.isWorkday && !ctx.isHoliday;
  }

  if (eventType === TIMELINE_EVENT_TYPES.ASISTENCIA) {
    payableByEmployer = ctx.isWorkday;
  }

  return {
    date: dateStr,

    // contexto calendario
    dayIndex: ctx.dayIndex,
    isWorkday: ctx.isWorkday,
    isRestDay: ctx.isRestDay,
    isHoliday: ctx.isHoliday,
    holidayName: ctx.holidayInfo?.nombre ?? null,
    isMandatoryHoliday: Boolean(ctx.holidayInfo?.es_obligatorio),
    eventType,
    incapacity: incapacityRow,
    vacation: vacationRow,
    leave: leaveRow,
    attendance: attendanceAgg,
    payableByEmployer,

    // espacio para resultados
    payroll: null,
  };
}
