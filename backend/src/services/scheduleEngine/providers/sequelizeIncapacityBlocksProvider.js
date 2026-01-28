// services/scheduleEngine/providers/sequelizeIncapacityBlocksProvider.js

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { loadIncapacityBlocksByDateRange } from "./sequelizeIncapacityProvider.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function addDays(dateStr, days, tz) {
  return dayjs.tz(dateStr, tz).add(days, "day").format("YYYY-MM-DD");
}

function isNextDay(aEnd, bStart, tz) {
  return addDays(aEnd, 1, tz) === String(bStart);
}

function sameTipo(a, b) {
  const aTipo = String(a?.tipoIncapacidad?.nombre ?? a?.tipo ?? "").toUpperCase();
  const bTipo = String(b?.tipoIncapacidad?.nombre ?? b?.tipo ?? "").toUpperCase();
  return aTipo && bTipo && aTipo === bTipo;
}

/**
 * Une incapacidades contiguas (extensiones) si:
 * - Son del mismo tipo
 * - La siguiente empieza exactamente el día siguiente al fin de la anterior
 */
export function normalizeIncapacityBlocks(blocks, tz = "America/Costa_Rica") {
  const rows = Array.isArray(blocks) ? [...blocks] : [];
  if (rows.length <= 1) return rows;

  rows.sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)));

  const out = [];
  let current = rows[0];

  for (let i = 1; i < rows.length; i++) {
    const next = rows[i];

    const curEnd = String(current.fecha_fin);
    const nextStart = String(next.fecha_inicio);

    if (sameTipo(current, next) && isNextDay(curEnd, nextStart, tz)) {
      current = {
        ...current,
        fecha_fin: String(next.fecha_fin),
        __merged_ids: [
          ...(current.__merged_ids || [current.id_incapacidad]),
          next.id_incapacidad,
        ],
      };
      continue;
    }

    out.push(current);
    current = next;
  }

  out.push(current);
  return out;
}

/**
 * Construye un índice fecha->bloque de incapacidad
 */
export function indexIncapacityBlocksByDate(blocks, tz = "America/Costa_Rica") {
  const map = new Map();

  for (const b of blocks || []) {
    const start = String(b.fecha_inicio);
    const end = String(b.fecha_fin);

    let cursor = dayjs.tz(start, tz).startOf("day");
    const endD = dayjs.tz(end, tz).startOf("day");

    while (cursor.isSame(endD) || cursor.isBefore(endD)) {
      const dateStr = cursor.format("YYYY-MM-DD");
      map.set(dateStr, b);
      cursor = cursor.add(1, "day");
    }
  }

  return map;
}

/**
 * Provider principal para el timeline.
 *
 * @returns {Promise<{ blocks: any[], indexByDate: Map<string, any> }>}
 */
export async function loadIncapacityBlocksForTimeline({
  idColaborador,
  startDate,
  endDate,
  models,
  transaction,
  tz = "America/Costa_Rica",
}) {
  if (!models?.Incapacidad) {
    throw new Error("loadIncapacityBlocksForTimeline: models.Incapacidad es requerido");
  }

  const rows = await loadIncapacityBlocksByDateRange({
    models,
    idColaborador,
    fromDateStr: startDate,
    toDateStr: endDate,
    transaction,
  });

  const normalized = normalizeIncapacityBlocks(rows, tz);

  const indexByDate = indexIncapacityBlocksByDate(normalized, tz);

  return {
    blocks: normalized,
    indexByDate,
  };
}
