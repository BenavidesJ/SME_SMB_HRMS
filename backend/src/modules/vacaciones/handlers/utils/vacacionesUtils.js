import dayjs from "dayjs";
import { Estado } from "../../../../models/index.js";

const DAY_INDEX_TO_CHAR = Object.freeze({
  0: "D",
  1: "L",
  2: "M",
  3: "K",
  4: "J",
  5: "V",
  6: "S",
});

const KNOWN_DAY_CHARS = new Set(["D", "L", "M", "K", "J", "V", "S"]);

export function assertId(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${fieldName} debe ser un entero positivo`);
  }
  return n;
}

export function assertDate(value, fieldName) {
  const str = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD`);
  }
  const date = dayjs(str, "YYYY-MM-DD", true);
  if (!date.isValid()) {
    throw new Error(`${fieldName} es una fecha inválida`);
  }
  return date;
}

export function listDatesInclusive(startDate, endDate) {
  const dates = [];
  let cursor = startDate.clone();
  const limit = endDate.clone();
  while (cursor.isSame(limit) || cursor.isBefore(limit)) {
    dates.push(cursor.format("YYYY-MM-DD"));
    cursor = cursor.add(1, "day");
  }
  return dates;
}

export function getDayChar(dateStr) {
  const d = dayjs(dateStr, "YYYY-MM-DD", true);
  if (!d.isValid()) {
    throw new Error(`Fecha inválida: ${dateStr}`);
  }
  return DAY_INDEX_TO_CHAR[d.day()];
}

export function normalizeDayChars(value) {
  const chars = new Set();
  for (const ch of String(value ?? "").trim().toUpperCase()) {
    if (KNOWN_DAY_CHARS.has(ch)) {
      chars.add(ch);
    }
  }
  return chars;
}

export async function fetchEstadoId({ transaction, nombre }) {
  const row = await Estado.findOne({
    where: { estado: nombre },
    attributes: ["id_estado"],
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });
  if (!row) {
    throw new Error(`No se encontró el estado "${nombre}" en el catálogo`);
  }
  return Number(row.id_estado);
}

export function collectConflictDates({ solicitudes, startStr, endStr }) {
  const conflicts = new Set();
  const inicioBase = dayjs(startStr, "YYYY-MM-DD", true);
  const finBase = dayjs(endStr, "YYYY-MM-DD", true);

  for (const solicitud of solicitudes) {
    const inicio = dayjs(String(solicitud.fecha_inicio), "YYYY-MM-DD", true);
    const fin = dayjs(String(solicitud.fecha_fin), "YYYY-MM-DD", true);
    if (!inicio.isValid() || !fin.isValid()) continue;

    const rangoInicio = inicio.isAfter(inicioBase) ? inicio : inicioBase;
    const rangoFin = fin.isBefore(finBase) ? fin : finBase;

    let cursor = rangoInicio.clone();
    while (cursor.isSame(rangoFin) || cursor.isBefore(rangoFin)) {
      conflicts.add(cursor.format("YYYY-MM-DD"));
      cursor = cursor.add(1, "day");
    }
  }
  return conflicts;
}

export function splitDatesBySchedule({ requestedDates = [], horario }) {
  const workingChars = normalizeDayChars(horario?.dias_laborales);
  const restChars = normalizeDayChars(horario?.dias_libres);

  const workingDates = [];
  const restDates = [];

  for (const date of requestedDates) {
    const dayChar = getDayChar(date);
    if (workingChars.has(dayChar)) {
      workingDates.push(date);
    } else if (restChars.has(dayChar) || !workingChars.has(dayChar)) {
      restDates.push(date);
    }
  }

  return { workingDates, restDates };
}
