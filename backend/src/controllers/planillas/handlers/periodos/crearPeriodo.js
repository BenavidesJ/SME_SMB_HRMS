import { sequelize, PeriodoPlanilla, Estado } from "../../../../models/index.js";

/**
 * Crear un nuevo Periodo de Planilla
 *
 * @param {{
 *   fecha_inicio: string (YYYY-MM-DD),
 *   fecha_fin: string (YYYY-MM-DD),
 *   fecha_pago: string (YYYY-MM-DD),
 *   id_ciclo_pago: number,
 *   descripcion?: string
 * }} payload
 * @returns {Promise<{id:number, fecha_inicio:string, fecha_fin:string, fecha_pago:string, id_ciclo_pago:number, estado:number, descripcion:string}>}
 */
export const crearPeriodo = async ({
  fecha_inicio,
  fecha_fin,
  fecha_pago,
  id_ciclo_pago,
  descripcion,
}) => {
  const tx = await sequelize.transaction();

  try {
    const fInicio = new Date(fecha_inicio);
    const fFin = new Date(fecha_fin);
    const fPago = new Date(fecha_pago);

    if (isNaN(fInicio.getTime())) {
      throw new Error("fecha_inicio debe ser una fecha válida (YYYY-MM-DD)");
    }

    if (isNaN(fFin.getTime())) {
      throw new Error("fecha_fin debe ser una fecha válida (YYYY-MM-DD)");
    }

    if (isNaN(fPago.getTime())) {
      throw new Error("fecha_pago debe ser una fecha válida (YYYY-MM-DD)");
    }

    if (fInicio >= fFin) {
      throw new Error("fecha_inicio debe ser anterior a fecha_fin");
    }

    const ciclo = Number(id_ciclo_pago);
    if (!Number.isFinite(ciclo) || ciclo <= 0) {
      throw new Error("id_ciclo_pago debe ser un número entero positivo");
    }

    const estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      transaction: tx,
    });

    if (!estadoActivo) {
      throw new Error('No existe Estado con estado="ACTIVO" en el catálogo');
    }

    const idEstadoActivo = estadoActivo.id_estado;

    // Crear período
    const created = await PeriodoPlanilla.create(
      {
        fecha_inicio: String(fecha_inicio).trim(),
        fecha_fin: String(fecha_fin).trim(),
        fecha_pago: String(fecha_pago).trim(),
        id_ciclo_pago: ciclo,
        estado: idEstadoActivo,
        descripcion: descripcion ? String(descripcion).trim() : "N/A",
      },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id: created.id_periodo,
      fecha_inicio: created.fecha_inicio,
      fecha_fin: created.fecha_fin,
      fecha_pago: created.fecha_pago,
      id_ciclo_pago: created.id_ciclo_pago,
      estado: created.estado,
      descripcion: created.descripcion,
    };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
