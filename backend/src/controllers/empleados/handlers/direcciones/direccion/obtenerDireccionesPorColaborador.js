import { Direccion } from "../../../../../models/index.js";

/**
 * Obtener direcciones por colaborador
 *
 * @param {Object} params
 * @param {number|string} params.id_colaborador
 * @param {boolean=} params.solo_activas 
 * @returns {Promise<Array>}
 */
export const obtenerDireccionesPorColaborador = async ({
  id_colaborador,
  solo_activas = true,
}) => {
  const cid = Number(id_colaborador);
  if (!Number.isInteger(cid) || cid <= 0) throw new Error("id_colaborador inválido");

  const where = { id_colaborador: cid };
  if (solo_activas) where.estado = 1;

  const direcciones = await Direccion.findAll({
    where,
    order: [
      ["es_principal", "DESC"],
      ["id_direccion", "DESC"],
    ],
  });

  return direcciones;
};
