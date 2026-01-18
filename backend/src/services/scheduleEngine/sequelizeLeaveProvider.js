import { Op } from "sequelize";

/**
 * Traslape DATETIME (inclusive):
 * startA <= endB && endA >= startB
 */
export async function hasLeaveOverlap({
  models,
  idColaborador,
  fecha_inicio,
  fecha_fin,
  blockingStatusIds = [],
  transaction,
  excludeId = null,
}) {
  if (!models?.SolicitudPermisosLicencias) {
    throw new Error("hasLeaveOverlap: models.SolicitudPermisosLicencias es requerido");
  }
  if (!Number.isFinite(Number(idColaborador))) {
    throw new Error("hasLeaveOverlap: idColaborador inválido");
  }
  if (!fecha_inicio || !fecha_fin) {
    throw new Error("hasLeaveOverlap: fecha_inicio/fecha_fin son requeridas");
  }

  const where = {
    id_colaborador: Number(idColaborador),
    fecha_inicio: { [Op.lte]: fecha_fin },
    fecha_fin: { [Op.gte]: fecha_inicio },
    ...(blockingStatusIds.length ? { estado_solicitud: { [Op.in]: blockingStatusIds } } : {}),
  };

  if (excludeId) {
    where.id_solicitud = { [Op.ne]: excludeId };
  }

  const found = await models.SolicitudPermisosLicencias.findOne({
    where,
    attributes: ["id_solicitud"],
    transaction,
  });

  return Boolean(found);
}
