import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Segun el Código de Trabajo CR:
 * - 1 día por cada mes desde Contrato.fecha_inicio.
 *
 * @param {Object} params
 * @param {string} params.contratoFechaInicio - YYYY-MM-DD
 * @param {string} params.todayDate - YYYY-MM-DD
 * @param {string} [params.tz]
 * @returns {{ mesesCompletos: number, dias_ganados: number }}
 */
export function computeDiasGanadosVacaciones({
  contratoFechaInicio,
  todayDate,
  tz = "America/Costa_Rica",
}) {
  const start = dayjs.tz(contratoFechaInicio, tz).startOf("day");
  const today = dayjs.tz(todayDate, tz).startOf("day");

  if (!start.isValid()) throw new Error("computeDiasGanadosVacaciones: contratoFechaInicio inválido");
  if (!today.isValid()) throw new Error("computeDiasGanadosVacaciones: todayDate inválido");

  if (today.isBefore(start)) {
    return { mesesCompletos: 0, dias_ganados: 0 };
  }

  const months = Math.max(0, today.diff(start, "month"));

  return { mesesCompletos: months, dias_ganados: months };
}
