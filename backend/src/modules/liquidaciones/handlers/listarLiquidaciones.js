import { Liquidacion, Colaborador, CausaLiquidacion } from "../../../models/index.js";
import { Op } from "sequelize";

/**
 * Lista liquidaciones con filtros opcionales
 * @param {object} filtros - {idColaborador, causa, anio, limit, offset}
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<{rows: object[], count: number}>}
 */
export async function listarLiquidaciones(filtros = {}, transaction) {
  const { idColaborador, causa, anio, limit = 10, offset = 0 } = filtros;

  const where = {};

  if (idColaborador) {
    where.id_colaborador = idColaborador;
  }

  if (anio) {
    const inicioAnio = `${anio}-01-01`;
    const finAnio = `${anio}-12-31`;
    where.fecha_terminacion = {
      [Op.between]: [inicioAnio, finAnio],
    };
  }

  const include = [
    {
      model: Colaborador,
      as: "colaborador",
      attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
    },
    {
      model: CausaLiquidacion,
      as: "causaRef",
      attributes: ["id_causa_liquidacion", "causa_liquidacion"],
    },
  ];

  if (causa) {
    include[1].where = { causa_liquidacion: causa };
  }

  const { rows, count } = await Liquidacion.findAndCountAll({
    where,
    include,
    limit,
    offset,
    order: [["fecha_terminacion", "DESC"]],
    ...(transaction ? { transaction } : {}),
  });

  return {
    rows: rows.map((r) => ({
      id_caso_termina: r.id_caso_termina,
      colaborador: r.colaborador.nombre + " " + r.colaborador.primer_apellido,
      causa: r.causaRef?.causa_liquidacion || "N/A",
      fechaTerminacion: r.fecha_terminacion,
      montoTotal:
        (r.aguinaldo_proporcional || 0) +
        (r.monto_cesantia || 0) +
        (r.monto_preaviso || 0) +
        (r.otros_montos || 0),
      aprobador: r.id_aprobador,
      fechaAprobacion: r.fecha_aprobacion,
    })),
    count,
  };
}
