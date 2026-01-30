import { PeriodoPlanilla } from "../../../../models/index.js";

/**
 * Obtener un periodo de planilla por ID
 *
 * @param {{ id_periodo: number|string }} payload
 * @returns {Promise<{id:number, fecha_inicio:string, fecha_fin:string, fecha_pago:string, id_ciclo_pago:number, estado:number, descripcion:string}>}
 */
export const obtenerPeriodoPorId = async ({ id_periodo }) => {
  const id = Number(String(id_periodo).trim());

  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("id_periodo debe ser un número entero positivo");
  }

  const row = await PeriodoPlanilla.findByPk(id);

  if (!row) {
    throw new Error(`No existe periodo de planilla con id ${id}`);
  }

  return {
    id: row.id_periodo,
    fecha_inicio: row.fecha_inicio,
    fecha_fin: row.fecha_fin,
    fecha_pago: row.fecha_pago,
    id_ciclo_pago: row.id_ciclo_pago,
    estado: row.estado,
    descripcion: row.descripcion,
  };
};
