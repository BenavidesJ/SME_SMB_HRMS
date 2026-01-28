import dayjs from "dayjs";
import { Op } from "sequelize";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Normaliza y valida dateStr (YYYY-MM-DD).
 */
function assertDateStr(dateStr, fieldName) {
  if (typeof dateStr !== "string" || !DATE_RE.test(dateStr)) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD`);
  }

  const d = dayjs(dateStr, "YYYY-MM-DD", true);
  if (!d.isValid()) {
    throw new Error(`${fieldName} no es una fecha válida YYYY-MM-DD`);
  }

  return d;
}

/**
 * Retorna true si existe una incapacidad cuyo rango [fecha_inicio, fecha_fin]
 * cubre la fecha dateStr (inclusive).
 *
 *
 * @param {Object} params
 * @param {{ Incapacidad: any }} params.models
 * @param {number} params.idColaborador
 * @param {string} params.dateStr - YYYY-MM-DD
 * @param {object} [params.transaction]
 * @returns {Promise<boolean>}
 */
export async function existsIncapacityCoveringDate({
  models,
  idColaborador,
  dateStr,
  transaction,
}) {
  if (!models?.Incapacidad) {
    throw new Error("existsIncapacityCoveringDate: models.Incapacidad es requerido");
  }
  if (!Number.isFinite(Number(idColaborador))) {
    throw new Error("existsIncapacityCoveringDate: idColaborador inválido");
  }
  assertDateStr(dateStr);

  const row = await models.Incapacidad.findOne({
    where: {
      id_colaborador: Number(idColaborador),
      fecha_inicio: { [Op.lte]: dateStr },
      fecha_fin: { [Op.gte]: dateStr },
    },
    attributes: ["id_incapacidad"],
    transaction,
  });

  return Boolean(row);
}

/**
 * Carga incapacidades que traslapan el rango [fromDateStr, toDateStr] (inclusive).
 *
 *
 * @param {Object} params
 * @param {{ Incapacidad: any, TipoIncapacidad?: any }} params.models
 * @param {number} params.idColaborador
 * @param {string} params.fromDateStr - YYYY-MM-DD
 * @param {string} params.toDateStr - YYYY-MM-DD
 * @param {object} [params.transaction]
 * @returns {Promise<Array>}
 */
export async function loadIncapacityBlocksByDateRange({
  models,
  idColaborador,
  fromDateStr,
  toDateStr,
  transaction,
}) {
  if (!models?.Incapacidad) {
    throw new Error("loadIncapacityBlocksByDateRange: models.Incapacidad es requerido");
  }
  if (!Number.isFinite(Number(idColaborador))) {
    throw new Error("loadIncapacityBlocksByDateRange: idColaborador inválido");
  }
  assertDateStr(fromDateStr, "fromDateStr");
  assertDateStr(toDateStr, "toDateStr");

  const include = [];
  if (models.TipoIncapacidad) {
    include.push({
      model: models.TipoIncapacidad,
      // as: "tipoIncapacidad",
      attributes: ["id_tipo_incap", "nombre"],
      required: false,
    });
  }

  const rows = await models.Incapacidad.findAll({
    where: {
      id_colaborador: Number(idColaborador),
      fecha_inicio: { [Op.lte]: toDateStr },
      fecha_fin: { [Op.gte]: fromDateStr },
    },
    attributes: [
      "id_incapacidad",
      "id_colaborador",
      "id_tipo_incap",
      "fecha_inicio",
      "fecha_fin",
      "porcentaje_patrono",
      "porcentaje_ccss",
      "observaciones",
    ],
    include,
    order: [["fecha_inicio", "ASC"]],
    transaction,
  });

  return rows;
}

/**
 * Mapea incapacidades a eventos para calendario/timeline.
 *
 * @param {Array} incapRows
 * @returns {Array}
 */
export function mapIncapacitiesToCalendarEvents(incapRows) {
  if (!Array.isArray(incapRows)) return [];

  return incapRows.map((r) => {
    const tipo = r?.tipoIncapacidad?.nombre ?? null;

    return {
      id: `INCAP-${r.id_incapacidad}`,
      type: "INCAPACIDAD",
      title: tipo ? `Incapacidad: ${tipo}` : "Incapacidad",
      start: r.fecha_inicio,
      end: r.fecha_fin,
      allDay: true,
      endInclusive: true,
      meta: {
        id_incapacidad: r.id_incapacidad,
        id_tipo_incap: r.id_tipo_incap,
        porcentaje_patrono: Number(r.porcentaje_patrono ?? 0),
        porcentaje_ccss: Number(r.porcentaje_ccss ?? 0),
        observaciones: r.observaciones ?? "N/A",
        tipo,
      },
    };
  });
}


/**
 * Retorna true si existe al menos una incapacidad que se traslape con [fecha_inicio, fecha_fin].
 *
 * Traslape entre rangos (inclusive):
 * A: [startA, endA]
 * B: [startB, endB]
 * Se traslapan si: startA <= endB && endA >= startB
 */
export async function hasIncapacityOverlap({
  models,
  idColaborador,
  fecha_inicio,
  fecha_fin,
  transaction,
  excludeId = null,
}) {
  if (!models?.Incapacidad) throw new Error("hasIncapacityOverlap: models.Incapacidad es requerido");
  if (!idColaborador) throw new Error("hasIncapacityOverlap: idColaborador es requerido");
  if (!fecha_inicio || !fecha_fin) throw new Error("hasIncapacityOverlap: fecha_inicio/fecha_fin son requeridas");

  const where = {
    id_colaborador: idColaborador,
    fecha_inicio: { [Op.lte]: fecha_fin },
    fecha_fin: { [Op.gte]: fecha_inicio },
  };

  if (excludeId) {
    where.id_incapacidad = { [Op.ne]: excludeId };
  }

  const found = await models.Incapacidad.findOne({
    where,
    attributes: ["id_incapacidad"],
    transaction,
  });

  return Boolean(found);
}