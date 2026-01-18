import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { parseToTz, splitByMidnight } from "./timeAdapter.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function minutesOverlap(aStart, aEnd, bStart, bEnd) {
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}

function sumOverlapWithWindows(segment, windows) {
  let total = 0;
  for (const w of windows || []) {
    total += minutesOverlap(segment.startMin, segment.endMin, w.start, w.end);
  }
  return total;
}

/**
 * Clasifica un intervalo de trabajo en horas ordinarias y extra.
 *
 * @param {Object} params
 * @param {Date|string} params.entradaTs
 * @param {Date|string} params.salidaTs
 * @param {string} params.dateStr - YYYY-MM-DD
 * @param {Object} params.template - template generado por engine
 *
 * @returns {{
 *  workedMinutes: number,
 *  ordinaryMinutes: number,
 *  extraMinutes: number,
 *  ordinaryHours: number,
 *  extraHours: number,
 *  warnings: string[]
 * }}
 */
export function classifyWorkedIntervalForDay({
  entradaTs,
  salidaTs,
  dateStr,
  template,
}) {
  if (!template) throw new Error("classifyWorkedIntervalForDay: el template es requerido");
  if (!entradaTs || !salidaTs) {
    return {
      workedMinutes: 0,
      ordinaryMinutes: 0,
      extraMinutes: 0,
      ordinaryHours: 0,
      extraHours: 0,
      warnings: [],
    };
  }

  const tz = template.timezone || "America/Costa_Rica";
  const warnings = [];

  const entrada = parseToTz(entradaTs, tz);
  const salida = parseToTz(salidaTs, tz);

  if (!entrada.isValid() || !salida.isValid()) {
    throw new Error("classifyWorkedIntervalForDay: invalid entradaTs/salidaTs");
  }
  if (!salida.isAfter(entrada)) {
    return {
      workedMinutes: 0,
      ordinaryMinutes: 0,
      extraMinutes: 0,
      ordinaryHours: 0,
      extraHours: 0,
      warnings: ["SALIDA_ANTES_O_IGUAL_ENTRADA"],
    };
  }

  // Segmentar por medianoche para soportar nocturnos/mixtos
  const segments = splitByMidnight(entrada, salida, tz);

  let workedMinutes = 0;
  let ordinaryMinutes = 0;

  for (const seg of segments) {
    const segMinutes = clamp(seg.endMin - seg.startMin, 0, 1440);
    workedMinutes += segMinutes;

    const isRestDay = Array.isArray(template.restDays) && template.restDays.includes(seg.dayIndex);
    const windows = template.virtualWindowsByDay?.[seg.dayIndex] || [];

    const isWorkday = !isRestDay && Array.isArray(windows) && windows.length > 0;

    if (!isWorkday) {
      continue;
    }

    ordinaryMinutes += sumOverlapWithWindows(seg, windows);
  }

  ordinaryMinutes = clamp(ordinaryMinutes, 0, workedMinutes);
  let extraMinutes = clamp(workedMinutes - ordinaryMinutes, 0, workedMinutes);

  const breakMin = Number(template.minutos_descanso ?? 0);
  if (Number.isFinite(breakMin) && breakMin > 0) {
    if (breakMin >= workedMinutes) {
      warnings.push("MINUTOS_NEGATIVOS_POR_DESCANSO");
      workedMinutes = 0;
      ordinaryMinutes = 0;
      extraMinutes = 0;
    } else {
      let remaining = breakMin;

      const decOrd = Math.min(ordinaryMinutes, remaining);
      ordinaryMinutes -= decOrd;
      remaining -= decOrd;

      if (remaining > 0) {
        const decExtra = Math.min(extraMinutes, remaining);
        extraMinutes -= decExtra;
      }

      workedMinutes = ordinaryMinutes + extraMinutes;
    }
  }

  if (workedMinutes > 0 && ordinaryMinutes === 0) {
    warnings.push("DIA_NO_LABORAL_CARGADO_COMO_EXTRA");
  }
  if (extraMinutes > 0 && ordinaryMinutes > 0) {
    warnings.push("SALIDA_TARDE_EXTRA");
  }

  return {
    workedMinutes,
    ordinaryMinutes,
    extraMinutes,
    ordinaryHours: round2(ordinaryMinutes / 60),
    extraHours: round2(extraMinutes / 60),
    warnings,
  };
}
