import { Op } from "sequelize";

/**
 * Carga horas extra APROBADAS agregadas por fecha (YYYY-MM-DD) para un colaborador.
 *
 * Output:
 *  Map<dateStr, number>  // horas aprobadas en esa fecha
 *
 *
 * @param {{
 *   models: { SolicitudHoraExtra: any },
 *   idColaborador: number|string,
 *   startDate: string, // YYYY-MM-DD
 *   endDate: string,   // YYYY-MM-DD
 *   approvedEstadoIds: Array<number|string>,
 *   transaction?: any
 * }} params
 */
export async function loadApprovedOvertimeByDateRange({
  models,
  idColaborador,
  startDate,
  endDate,
  approvedEstadoIds = [],
  transaction,
}) {
  if (!models?.SolicitudHoraExtra) {
    throw new Error("loadApprovedOvertimeByDateRange: models.SolicitudHoraExtra es requerido");
  }
  const id = Number(idColaborador);
  if (!Number.isFinite(id)) {
    throw new Error("loadApprovedOvertimeByDateRange: idColaborador inválido");
  }
  if (!startDate || !endDate) {
    throw new Error("loadApprovedOvertimeByDateRange: startDate/endDate requeridos");
  }

  const estadoIds = (approvedEstadoIds || []).map(Number).filter(Number.isFinite);

  const where = {
    id_colaborador: id,
    fecha_trabajo: { [Op.between]: [startDate, endDate] },
    ...(estadoIds.length ? { estado_solicitud: { [Op.in]: estadoIds } } : {}),
  };

  const rows = await models.SolicitudHoraExtra.findAll({
    where,
    attributes: ["fecha_trabajo", "horas_aprobadas"],
    order: [["fecha_trabajo", "ASC"]],
    transaction,
  });

  const map = new Map();

  for (const r of rows || []) {
    const dateStr = String(r.fecha_trabajo);
    const horas = Number(r.horas_aprobadas || 0);
    if (!dateStr || !Number.isFinite(horas) || horas <= 0) continue;

    const prev = Number(map.get(dateStr) || 0);
    map.set(dateStr, prev + horas);
  }

  return map;
}
