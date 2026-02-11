import { Op } from "sequelize";
import { Aguinaldo, Colaborador } from "../../../models/index.js";

/**
 * Lista los registros de aguinaldo con filtros opcionales.
 *
 * @param {{ anio?: number, id_colaborador?: number }} params
 * @returns {Promise<object[]>}
 */
export async function listarAguinaldos({ anio, id_colaborador } = {}) {
  const where = {};

  if (anio) {
    where.anio = anio;
  }
  if (id_colaborador) {
    where.id_colaborador = id_colaborador;
  }

  const registros = await Aguinaldo.findAll({
    where,
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido", "identificacion"],
      },
      {
        model: Colaborador,
        as: "registradoPor",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
      },
    ],
    order: [["id_aguinaldo", "DESC"]],
  });

  return registros.map((r) => {
    const data = r.toJSON();
    const col = data.colaborador;
    const reg = data.registradoPor;

    return {
      id_aguinaldo: data.id_aguinaldo,
      id_colaborador: data.id_colaborador,
      nombre_completo: col
        ? [col.nombre, col.primer_apellido, col.segundo_apellido].filter(Boolean).join(" ")
        : `Colaborador #${data.id_colaborador}`,
      identificacion: col?.identificacion ?? null,
      anio: data.anio,
      periodo_desde: data.periodo_desde,
      periodo_hasta: data.periodo_hasta,
      monto_calculado: Number(data.monto_calculado),
      fecha_pago: data.fecha_pago,
      registrado_por_nombre: reg
        ? [reg.nombre, reg.primer_apellido, reg.segundo_apellido].filter(Boolean).join(" ")
        : `Colaborador #${data.registrado_por}`,
    };
  });
}
