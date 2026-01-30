import { sequelize, PeriodoPlanilla } from "../../../../models/index.js";

/**
 * Actualizar un Periodo de Planilla
 *
 * @param {{
 *   id_periodo: number|string,
 *   fecha_inicio?: string (YYYY-MM-DD),
 *   fecha_fin?: string (YYYY-MM-DD),
 *   fecha_pago?: string (YYYY-MM-DD),
 *   id_ciclo_pago?: number,
 *   descripcion?: string
 * }} payload
 * @returns {Promise<{id:number, fecha_inicio:string, fecha_fin:string, fecha_pago:string, id_ciclo_pago:number, estado:number, descripcion:string}>}
 */
export const actualizarPeriodo = async ({
  id_periodo,
  fecha_inicio,
  fecha_fin,
  fecha_pago,
  id_ciclo_pago,
  descripcion,
}) => {
  const tx = await sequelize.transaction();

  try {
    const id = Number(String(id_periodo).trim());

    if (!Number.isFinite(id) || id <= 0) {
      throw new Error("id_periodo debe ser un número entero positivo");
    }

    const current = await PeriodoPlanilla.findByPk(id, { transaction: tx });

    if (!current) {
      throw new Error(`No existe periodo de planilla con id ${id}`);
    }

    const updates = {};

    if (fecha_inicio !== undefined) {
      const fInicio = new Date(fecha_inicio);
      if (isNaN(fInicio.getTime())) {
        throw new Error("fecha_inicio debe ser una fecha válida (YYYY-MM-DD)");
      }
      updates.fecha_inicio = String(fecha_inicio).trim();
    }

    if (fecha_fin !== undefined) {
      const fFin = new Date(fecha_fin);
      if (isNaN(fFin.getTime())) {
        throw new Error("fecha_fin debe ser una fecha válida (YYYY-MM-DD)");
      }
      updates.fecha_fin = String(fecha_fin).trim();
    }

    if (fecha_pago !== undefined) {
      const fPago = new Date(fecha_pago);
      if (isNaN(fPago.getTime())) {
        throw new Error("fecha_pago debe ser una fecha válida (YYYY-MM-DD)");
      }
      updates.fecha_pago = String(fecha_pago).trim();
    }

    if (id_ciclo_pago !== undefined) {
      const ciclo = Number(id_ciclo_pago);
      if (!Number.isFinite(ciclo) || ciclo <= 0) {
        throw new Error("id_ciclo_pago debe ser un número entero positivo");
      }
      updates.id_ciclo_pago = ciclo;
    }

    if (descripcion !== undefined) {
      const desc = String(descripcion).trim();
      updates.descripcion = desc || "N/A";
    }

    const fInicio = updates.fecha_inicio || current.fecha_inicio;
    const fFin = updates.fecha_fin || current.fecha_fin;

    if (new Date(fInicio) >= new Date(fFin)) {
      throw new Error("fecha_inicio debe ser anterior a fecha_fin");
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("Debe enviar al menos un campo para actualizar");
    }

    await current.update(updates, { transaction: tx });

    await tx.commit();

    return {
      id: current.id_periodo,
      fecha_inicio: current.fecha_inicio,
      fecha_fin: current.fecha_fin,
      fecha_pago: current.fecha_pago,
      id_ciclo_pago: current.id_ciclo_pago,
      estado: current.estado,
      descripcion: current.descripcion,
    };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
