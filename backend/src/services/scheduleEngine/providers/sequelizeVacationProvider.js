import { Op } from "sequelize";

/**
 * Traslape:
 */
export async function hasVacationOverlapByDateRange({
  models,
  idColaborador,
  startDate,
  endDate,
  pendingEstadoIds = [],
  approvedEstadoIds = [],
  excludeId = null,
  transaction,
}) {
  if (!models?.SolicitudVacaciones) {
    throw new Error("hasVacationOverlapByDateRange: models.SolicitudVacaciones es requerido");
  }
  if (!Number.isFinite(Number(idColaborador))) {
    throw new Error("hasVacationOverlapByDateRange: idColaborador inválido");
  }
  if (!startDate || !endDate) {
    throw new Error("hasVacationOverlapByDateRange: startDate/endDate requeridos");
  }

  const estadoIds = [...new Set([...pendingEstadoIds, ...approvedEstadoIds])].filter(Boolean);

  const where = {
    id_colaborador: Number(idColaborador),
    fecha_inicio: { [Op.lte]: endDate },
    fecha_fin: { [Op.gte]: startDate },
    ...(estadoIds.length ? { estado_solicitud: { [Op.in]: estadoIds } } : {}),
  };

  if (excludeId) where.id_solicitud_vacaciones = { [Op.ne]: Number(excludeId) };

  const found = await models.SolicitudVacaciones.findOne({
    where,
    attributes: ["id_solicitud_vacaciones"],
    transaction,
  });

  return Boolean(found);
}

export async function getVacacionesByColaborador({
  models,
  idColaborador,
  limit = 50,
  offset = 0,
  transaction,
}) {
  if (!models?.SolicitudVacaciones) {
    throw new Error("getVacacionesByColaborador: models.SolicitudVacaciones es requerido");
  }
  if (!Number.isFinite(Number(idColaborador))) {
    throw new Error("getVacacionesByColaborador: idColaborador inválido");
  }

  const rows = await models.SolicitudVacaciones.findAll({
    where: { id_colaborador: Number(idColaborador) },
    order: [["fecha_inicio", "DESC"]],
    limit: Number(limit),
    offset: Number(offset),
    transaction,
  });

  console.log("debug",rows);
  return rows;
}

export async function getVacacionesByDateRange({
  models,
  idColaborador,
  startDate,
  endDate,
  transaction,
}) {
  if (!models?.SolicitudVacaciones) {
    throw new Error("getVacacionesByDateRange: models.SolicitudVacaciones es requerido");
  }
  if (!startDate || !endDate) throw new Error("getVacacionesByDateRange: startDate/endDate requeridos");

  const rows = await models.SolicitudVacaciones.findAll({
    where: {
      id_colaborador: Number(idColaborador),
      fecha_inicio: { [Op.lte]: endDate },
      fecha_fin: { [Op.gte]: startDate },
    },
    order: [["fecha_inicio", "ASC"]],
    transaction,
  });

  return rows;
}
