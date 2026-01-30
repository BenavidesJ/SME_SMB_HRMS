import { PeriodoPlanilla } from "../../../../models/index.js";

/**
 * Obtener todos los periodos de planilla
 * Ordenados por más reciente primero (id_periodo DESC)
 *
 * @returns {Promise<Array<{id:number, fecha_inicio:string, fecha_fin:string, fecha_pago:string, id_ciclo_pago:number, estado:number, descripcion:string}>>}
 */
export const obtenerPeriodos = async () => {
  const rows = await PeriodoPlanilla.findAll({
    order: [["id_periodo", "DESC"]],
  });

  return rows.map((r) => ({
    id: r.id_periodo,
    fecha_inicio: r.fecha_inicio,
    fecha_fin: r.fecha_fin,
    fecha_pago: r.fecha_pago,
    id_ciclo_pago: r.id_ciclo_pago,
    estado: r.estado,
    descripcion: r.descripcion,
  }));
};
