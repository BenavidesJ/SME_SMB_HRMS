import { TIMELINE_EVENT_TYPES } from "./timelineTypes.js";

/**
 * Precedencia de eventos (más alto = domina).
 *
 * Racional:
 * - INCAPACIDAD domina todo (no se debe trabajar; bloquea marcas y también se considera
 *   por encima de permisos/vacaciones a nivel de timeline).
 * - VACACIONES dominan permisos (si están aprobadas/pending según tu filtro).
 * - PERMISO domina asistencia (si hay un permiso ese día, aunque existan marcas).
 * - ASISTENCIA es lo más bajo (solo si no hay otra cosa).
 */
export const PRECEDENCE_SCORE = Object.freeze({
  [TIMELINE_EVENT_TYPES.NONE]: 0,
  [TIMELINE_EVENT_TYPES.ASISTENCIA]: 10,
  [TIMELINE_EVENT_TYPES.PERMISO]: 20,
  [TIMELINE_EVENT_TYPES.VACACIONES]: 30,
  [TIMELINE_EVENT_TYPES.INCAPACIDAD]: 40,
});

/**
 * Elige el tipo dominante.
 *
 * @param {Array<import("./timelineTypes.js").TimelineEventType>} candidates
 * @returns {import("./timelineTypes.js").TimelineEventType}
 */
export function chooseDominantEventType(candidates) {
  let best = TIMELINE_EVENT_TYPES.NONE;
  let bestScore = PRECEDENCE_SCORE[best];

  for (const c of candidates || []) {
    const key = c || TIMELINE_EVENT_TYPES.NONE;
    const score = PRECEDENCE_SCORE[key] ?? 0;
    if (score > bestScore) {
      best = key;
      bestScore = score;
    }
  }

  return best;
}

/**
 * Decide el eventType final del día.
 *
 * @param {Object} params
 * @param {boolean} params.hasIncapacity
 * @param {boolean} params.hasVacation
 * @param {boolean} params.hasLeave
 * @param {boolean} params.hasAttendance
 */
export function resolveEventTypeForDay({
  hasIncapacity,
  hasVacation,
  hasLeave,
  hasAttendance,
}) {
  const candidates = [];

  if (hasAttendance) candidates.push(TIMELINE_EVENT_TYPES.ASISTENCIA);
  if (hasLeave) candidates.push(TIMELINE_EVENT_TYPES.PERMISO);
  if (hasVacation) candidates.push(TIMELINE_EVENT_TYPES.VACACIONES);
  if (hasIncapacity) candidates.push(TIMELINE_EVENT_TYPES.INCAPACIDAD);

  return chooseDominantEventType(candidates);
}
