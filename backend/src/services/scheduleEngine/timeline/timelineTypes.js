
/**
 * Tipos y utilidades base para el Payroll Timeline.
 */

/**
 * @typedef {"NONE"|"INCAPACIDAD"|"VACACIONES"|"PERMISO"|"ASISTENCIA"} TimelineEventType
 */

/**
 * @typedef {"ENFERMEDAD"|"INS"|"MATERNIDAD"} IncapacityTipo
 */

/**
 * @typedef {Object} IncapacityMeta
 * @property {number|string} id_incapacidad
 * @property {IncapacityTipo} tipo
 * @property {string} fecha_inicio 
 * @property {string} fecha_fin     
 * @property {number} episodeId     
 * @property {number} episodeDay  
 * @property {"TRAMO_1_3"|"TRAMO_4_PLUS"} tramo
 * @property {{ patrono: number, ccss: number, ins: number }} porcentajes
 * @property {string|null} observaciones
 */

/**
 * @typedef {Object} VacationMeta
 * @property {number|string} id_solicitud_vacaciones
 * @property {string} fecha_inicio 
 * @property {string} fecha_fin  
 * @property {number|string|null} estado_solicitud
 */

/**
 * @typedef {Object} LeaveMeta
 * @property {number|string} id_solicitud
 * @property {Date|string} fecha_inicio 
 * @property {Date|string} fecha_fin    
 * @property {number|string|null} estado_solicitud
 * @property {string|null} tipo_permiso 
 */

/**
 * @typedef {Object} OvertimeMeta
 * @property {number} approvedHours
 */

/**
 * @typedef {Object} AttendanceMeta
 * @property {number} horas_trabajadas
 * @property {number} horas_extra
 * @property {number} horas_nocturnas
 */

/**
 * @typedef {Object} HolidayMeta
 * @property {string} nombre
 * @property {number} es_obligatorio 
 */

/**
 * @typedef {Object} TimelineDay
 * @property {string} date           
 * @property {number} dayIndex         
 * @property {boolean} isWorkday       
 * @property {boolean} isRestDay
 * @property {boolean} isHoliday
 * @property {HolidayMeta|null} holiday
 *
 * @property {TimelineEventType} eventType
 *
 * @property {boolean} payableByEmployer 
 * @property {boolean} payableByCCSS
 * @property {boolean} payableByINS
 *
 * @property {IncapacityMeta|null} incapacidad
 * @property {VacationMeta|null} vacaciones
 * @property {LeaveMeta|null} permiso
 * @property {OvertimeMeta|null} overtime
 * @property {AttendanceMeta|null} asistencia
 *
 * @property {string[]} warnings
 */

/**
 * Constantes de tipos de evento (dominantes).
 */
export const TIMELINE_EVENT_TYPES = Object.freeze({
  NONE: "NONE",
  INCAPACIDAD: "INCAPACIDAD",
  VACACIONES: "VACACIONES",
  PERMISO: "PERMISO",
  ASISTENCIA: "ASISTENCIA",
});

/**
 * Tipos de incapacidad soportados por el timeline.
 */
export const INCAPACITY_TIPO = Object.freeze({
  ENFERMEDAD: "ENFERMEDAD",
  INS: "INS",
  MATERNIDAD: "MATERNIDAD",
});

/**
 * Helper para crear el molde del día con defaults.
 *
 * @param {Object} params
 * @param {string} params.date
 * @param {number} params.dayIndex
 * @param {boolean} params.isWorkday
 * @param {boolean} params.isRestDay
 * @param {boolean} params.isHoliday
 * @param {HolidayMeta|null} params.holiday
 * @returns {TimelineDay}
 */
export function makeTimelineDayBase({
  date,
  dayIndex,
  isWorkday,
  isRestDay,
  isHoliday,
  holiday,
}) {
  return {
    date,
    dayIndex,
    isWorkday: Boolean(isWorkday),
    isRestDay: Boolean(isRestDay),
    isHoliday: Boolean(isHoliday),
    holiday: holiday || null,

    eventType: TIMELINE_EVENT_TYPES.NONE,

    payableByEmployer: false,
    payableByCCSS: false,
    payableByINS: false,

    incapacidad: null,
    vacaciones: null,
    permiso: null,
    overtime: null,
    asistencia: null,

    warnings: [],
  };
}
