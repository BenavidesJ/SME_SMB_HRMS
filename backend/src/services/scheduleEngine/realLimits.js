import { toDayIndex, toMinuteOfDay } from "./timeAdapter.js";
import { classifyWorkedIntervalForDay } from "./attendanceClassifier.js";

/**
 * Devuelve true si minute está dentro de cualquier range del día.
 */
function isMinuteInsideRanges(minute, ranges) {
  if (!Array.isArray(ranges)) return false;
  return ranges.some((r) => minute >= r.start && minute < r.end);
}

/**
 * Límite real por reloj
 */
export function validateRealWindowsForTimestamp({ timestamp, template }) {
  if (!template) throw new Error("validateRealWindowsForTimestamp: template requerido");

  const tz = template.timezone;
  const dayIndex = toDayIndex(timestamp, tz);
  const minute = toMinuteOfDay(timestamp, tz);

  const dayRanges = template.realWindowsByDay?.[dayIndex];
  if (!dayRanges || dayRanges.length === 0) {
    throw new Error("LIMITE_REAL: no hay ventanas reales definidas para el día");
  }

  if (!isMinuteInsideRanges(minute, dayRanges)) {
    throw new Error("LIMITE_REAL: marca fuera de ventana real permitida");
  }

  return { ok: true, dayIndex, minute };
}

/**
 * Límite real por duración (max horas continuas):
 * - Usa template.realConstraints.maxDailyMinutes
 * - Calcula workedMinutes con attendanceClassifier 
 * - Si excede => bloquea
 */
export function validateMaxDailyMinutesForInterval({
  entradaTs,
  salidaTs,
  dateStr,
  template,
}) {
  if (!template) throw new Error("validateMaxDailyMinutesForInterval: template requerido");

  const maxDailyMinutes = template.realConstraints?.maxDailyMinutes;

  if (!Number.isFinite(maxDailyMinutes) || maxDailyMinutes <= 0) {
    return { ok: true, skipped: true };
  }

  const classified = classifyWorkedIntervalForDay({
    entradaTs,
    salidaTs,
    dateStr,
    template,
  });

  if (classified.workedMinutes > maxDailyMinutes) {
    const maxH = Math.round((maxDailyMinutes / 60) * 100) / 100;
    const gotH = Math.round((classified.workedMinutes / 60) * 100) / 100;

    throw new Error(
      `LIMITE_REAL: excede máximo diario (${maxH}h). Intento: ${gotH}h`
    );
  }

  return { ok: true, workedMinutes: classified.workedMinutes, maxDailyMinutes };
}
