import { Op } from "sequelize";

/**
 * Busca el id_estado por nombre (APROBADO, ACTIVO, etc.).
 */
export async function getEstadoIdByNombre({ Estado, nombre, transaction }) {
  const row = await Estado.findOne({
    where: { estado: String(nombre).trim().toUpperCase() },
    attributes: ["id_estado", "estado"],
    transaction,
  });

  if (!row) {
    throw new Error(`No existe el estado "${nombre}" en el catálogo estado`);
  }
  return row.id_estado;
}

/**
 * Suma horas aprobadas de solicitudes APROBADAS del colaborador para esa fecha.
 *
 * @param {{
 *  models: {
 *    SolicitudHoraExtra: any,
 *    Estado: any,
 *  },
 *  idColaborador: number,
 *  dateStr: string, // YYYY-MM-DD
 *  transaction?: any
 * }} params
 */
export async function loadApprovedOvertimeHoursForDate({
  models,
  idColaborador,
  dateStr,
  transaction,
}) {
  const { SolicitudHoraExtra, Estado } = models;

  const ESTADO_APROBADO_ID = await getEstadoIdByNombre({
    Estado,
    nombre: "APROBADO",
    transaction,
  });

  const rows = await SolicitudHoraExtra.findAll({
    where: {
      id_colaborador: idColaborador,
      fecha_trabajo: dateStr,
      estado: ESTADO_APROBADO_ID,
    },
    attributes: ["horas_aprobadas", "horas_solicitadas"],
    transaction,
  });

  const total = rows.reduce((acc, r) => {
    const aprob = r.horas_aprobadas;
    const sol = r.horas_solicitadas;

    const n = aprob !== null && aprob !== undefined ? Number(aprob) : Number(sol);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);

  return round2(total);
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
