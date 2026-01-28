import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { Op } from "sequelize";

dayjs.extend(utc);
dayjs.extend(timezone);

function addDays(dateStr, days, tz) {
  return dayjs.tz(dateStr, tz).add(days, "day").format("YYYY-MM-DD");
}

function isNextDay(aEnd, bStart, tz) {
  return addDays(aEnd, 1, tz) === String(bStart);
}

/**
 * Une vacaciones contiguas si la segunda empieza el día siguiente al fin de la primera.
 */
export function normalizeVacationBlocks(blocks, tz = "America/Costa_Rica") {
  const rows = Array.isArray(blocks) ? [...blocks] : [];
  if (rows.length <= 1) return rows;

  rows.sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)));

  const out = [];
  let current = rows[0];

  for (let i = 1; i < rows.length; i++) {
    const next = rows[i];

    const curEnd = String(current.fecha_fin);
    const nextStart = String(next.fecha_inicio);

    if (isNextDay(curEnd, nextStart, tz)) {
      current = {
        ...current,
        fecha_fin: String(next.fecha_fin),
        __merged_ids: [
          ...(current.__merged_ids || [current.id_solicitud_vacaciones]),
          next.id_solicitud_vacaciones,
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
 * Indexa por fecha para buscar rápido en el loop diario.
 */
export function indexVacationBlocksByDate(blocks, tz = "America/Costa_Rica") {
  const map = new Map();

  for (const b of blocks || []) {
    const start = String(b.fecha_inicio);
    const end = String(b.fecha_fin);

    let cursor = dayjs.tz(start, tz).startOf("day");
    const endD = dayjs.tz(end, tz).startOf("day");

    while (cursor.isSame(endD) || cursor.isBefore(endD)) {
      map.set(cursor.format("YYYY-MM-DD"), b);
      cursor = cursor.add(1, "day");
    }
  }

  return map;
}

/**
 * Carga solicitudes de vacaciones que traslapan el rango.
 *
 * @param {{
 *   idColaborador: number,
 *   startDate: string, // YYYY-MM-DD
 *   endDate: string,   // YYYY-MM-DD
 *   models: { SolicitudVacaciones: any },
 *   transaction?: any,
 *   tz?: string,
 *   blockingStatusIds?: number[], // estados que se consideran "bloqueantes" en timeline (pendiente/aprobado)
 * }} params
 *
 * @returns {Promise<{ blocks: any[], indexByDate: Map<string, any> }>}
 */
export async function loadVacationBlocksForTimeline({
  idColaborador,
  startDate,
  endDate,
  models,
  transaction,
  tz = "America/Costa_Rica",
  blockingStatusIds = [],
}) {
  if (!models?.SolicitudVacaciones) {
    throw new Error("loadVacationBlocksForTimeline: models.SolicitudVacaciones es requerido");
  }
  if (!Number.isFinite(Number(idColaborador))) {
    throw new Error("loadVacationBlocksForTimeline: idColaborador inválido");
  }
  if (!startDate || !endDate) {
    throw new Error("loadVacationBlocksForTimeline: startDate/endDate requeridos");
  }

  const overlapWhere = {
    fecha_inicio: { [Op.lte]: endDate },
    fecha_fin: { [Op.gte]: startDate },
  };

  const rows = await models.SolicitudVacaciones.findAll({
    where: {
      id_colaborador: Number(idColaborador),
      ...overlapWhere,
      ...(blockingStatusIds.length
        ? { estado_solicitud: { [Op.in]: blockingStatusIds } }
        : {}),
    },
    attributes: [
      "id_solicitud_vacaciones",
      "id_colaborador",
      "estado_solicitud",
      "fecha_inicio",
      "fecha_fin",
      "observaciones",
    ],
    order: [["fecha_inicio", "ASC"]],
    transaction,
  });

  const normalized = normalizeVacationBlocks(rows, tz);
  const indexByDate = indexVacationBlocksByDate(normalized, tz);

  return { blocks: normalized, indexByDate };
}
