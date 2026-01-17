import { DAY_CHAR_TO_INDEX } from "./days.js";

/**
 * Convierte "HH:mm:ss" o "HH:mm" a minutos desde 00:00.
 * Ej: "08:00:00" => 480
 */
export function timeToMinutes(timeStr) {
  if (typeof timeStr !== "string") {
    throw new Error("timeToMinutes: timeStr must be a string");
  }

  const [hh, mm] = timeStr.split(":");
  const hours = Number.parseInt(hh, 10);
  const minutes = Number.parseInt(mm, 10);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    throw new Error(`timeToMinutes: invalid time string: ${timeStr}`);
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`timeToMinutes: out-of-range time: ${timeStr}`);
  }

  return hours * 60 + minutes;
}

/**
 * Convierte "LKMJV" => [0,1,2,3,4]
 * Convierte "SD" => [5,6]
 */
export function daysStringToIndexes(daysStr) {
  if (typeof daysStr !== "string") {
    throw new Error("daysStringToIndexes: daysStr must be a string");
  }

  const set = new Set();

  for (const ch of daysStr.trim().toUpperCase()) {
    const idx = DAY_CHAR_TO_INDEX[ch];
    if (idx === undefined) continue; // ignora basura
    set.add(idx);
  }

  return Array.from(set).sort((a, b) => a - b);
}

function makeRange(start, end) {
  if (!(Number.isFinite(start) && Number.isFinite(end))) {
    throw new Error("makeRange: start/end must be numbers");
  }
  if (start < 0 || end > 1440 || start >= end) {
    throw new Error(`makeRange: invalid range ${start}-${end}`);
  }
  return { start, end }; // end exclusivo
}

/**
 * Hard bound por día: [00:00, realEndMin)
 * MVP: 1440 => no bloquea marcas por hora.
 */
function buildRealWindowsByDay(realEndMin) {
  const out = {};
  for (let d = 0; d <= 6; d++) {
    out[d] = [makeRange(0, realEndMin)];
  }
  return out;
}

/**
 * Ventanas virtuales (jornada regular) por día.
 * Soporta cruce de medianoche:
 * - [startMin, 1440)
 * - [0, endMin)
 */
function buildVirtualWindowsByDay({ laborDays, startMin, endMin }) {
  const out = {};
  for (let d = 0; d <= 6; d++) out[d] = [];

  for (const dayIndex of laborDays) {
    if (startMin < endMin) {
      out[dayIndex] = [makeRange(startMin, endMin)];
    } else {
      out[dayIndex] = [
        makeRange(0, endMin),
        makeRange(startMin, 1440),
      ].sort((a, b) => a.start - b.start);
    }
  }

  return out;
}

/**
 * Genera el template a partir de HorarioLaboral (objeto).
 */
export function buildScheduleTemplateFromHorario({
  hora_inicio,
  hora_fin,
  dias_laborales,
  dias_libres,
  minutos_descanso = 0,
  id_tipo_jornada = null,
  max_horas_diarias = null,
  timezone = "America/Costa_Rica",
  realEndMin = 1440,
  
}) {
  const startMin = timeToMinutes(String(hora_inicio));
  const endMin = timeToMinutes(String(hora_fin));

  const laborDays = daysStringToIndexes(String(dias_laborales));
  const restDays = daysStringToIndexes(String(dias_libres));

  const virtualWindowsByDay = buildVirtualWindowsByDay({ laborDays, startMin, endMin });
  const realWindowsByDay = buildRealWindowsByDay(realEndMin);

  return {
    timezone,
    id_tipo_jornada,
    minutos_descanso: Number(minutos_descanso) || 0,
    laborDays,
    restDays,
    virtualWindowsByDay,
    realWindowsByDay,
    hora_inicio,
    hora_fin,
    realConstraints: {
      maxDailyMinutes: Number.isFinite(Number(max_horas_diarias))
      ? Math.round(Number(max_horas_diarias) * 60)
      : null,
    },
  };
}
