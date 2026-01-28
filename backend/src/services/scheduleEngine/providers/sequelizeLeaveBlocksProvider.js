import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { Op } from "sequelize";
import { parseToTz, toMinuteOfDay } from "../timeAdapter.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function explodeLeaveToDailySegments(leaveRow, tz) {
  const start = parseToTz(leaveRow.fecha_inicio, tz);
  const end = parseToTz(leaveRow.fecha_fin, tz);

  if (!start.isValid() || !end.isValid() || !end.isAfter(start)) return [];

  const out = [];
  let cursor = start.clone().startOf("day");
  const endDay = end.clone().startOf("day");

  while (cursor.isSame(endDay) || cursor.isBefore(endDay)) {
    const dateStr = cursor.format("YYYY-MM-DD");

    const dayStart = cursor.clone();
    const dayEnd = cursor.clone().add(1, "day");

    const segStart = start.isAfter(dayStart) ? start : dayStart;
    const segEnd = end.isBefore(dayEnd) ? end : dayEnd;

    if (segEnd.isAfter(segStart)) {
      const minutes =
        toMinuteOfDay(segEnd, tz) -
        toMinuteOfDay(segStart, tz);

      if (minutes > 0) {
        out.push({
          date: dateStr,
          minutes,
          hours: round2(minutes / 60),
          source: leaveRow,
        });
      }
    }

    cursor = cursor.add(1, "day");
  }

  return out;
}

/**
 * Indexa permisos por fecha para busqueda rápida en el timeline.
 *
 * Map<YYYY-MM-DD, { totalMinutes, totalHours, segments: [] }>
 */
export function indexLeaveBlocksByDate(dailySegments) {
  const map = new Map();

  for (const seg of dailySegments || []) {
    const prev = map.get(seg.date) || {
      totalMinutes: 0,
      totalHours: 0,
      segments: [],
    };

    const totalMinutes = prev.totalMinutes + seg.minutes;
    const totalHours = round2(totalMinutes / 60);

    map.set(seg.date, {
      totalMinutes,
      totalHours,
      segments: [...prev.segments, seg],
    });
  }

  return map;
}

/**
 * Provider principal para timeline de permisos/licencias.
 *
 * @param {{
 *   idColaborador: number,
 *   startDate: string, // YYYY-MM-DD
 *   endDate: string,   // YYYY-MM-DD
 *   models: { SolicitudPermisosLicencias: any },
 *   transaction?: any,
 *   tz?: string,
 *   blockingStatusIds?: number[]
 * }} params
 *
 * @returns {Promise<{ rows: any[], indexByDate: Map<string, any> }>}
 */
export async function loadLeaveBlocksForTimeline({
  idColaborador,
  startDate,
  endDate,
  models,
  transaction,
  tz = "America/Costa_Rica",
  blockingStatusIds = [],
}) {
  if (!models?.SolicitudPermisosLicencias) {
    throw new Error("loadLeaveBlocksForTimeline: models.SolicitudPermisosLicencias es requerido");
  }
  if (!Number.isFinite(Number(idColaborador))) {
    throw new Error("loadLeaveBlocksForTimeline: idColaborador inválido");
  }
  if (!startDate || !endDate) {
    throw new Error("loadLeaveBlocksForTimeline: startDate/endDate requeridos");
  }

  const fromTs = dayjs.tz(startDate, tz).startOf("day").toDate();
  const toTs = dayjs.tz(endDate, tz).endOf("day").toDate();

  const rows = await models.SolicitudPermisosLicencias.findAll({
    where: {
      id_colaborador: Number(idColaborador),
      fecha_inicio: { [Op.lte]: toTs },
      fecha_fin: { [Op.gte]: fromTs },
      ...(blockingStatusIds.length
        ? { estado_solicitud: { [Op.in]: blockingStatusIds } }
        : {}),
    },
    attributes: [
      "id_solicitud",
      "id_colaborador",
      "fecha_inicio",
      "fecha_fin",
      "estado_solicitud",
      "observaciones",
    ],
    order: [["fecha_inicio", "ASC"]],
    transaction,
  });

  const dailySegments = rows.flatMap((r) =>
    explodeLeaveToDailySegments(r, tz)
  );

  const indexByDate = indexLeaveBlocksByDate(dailySegments);

  return { rows, indexByDate };
}
