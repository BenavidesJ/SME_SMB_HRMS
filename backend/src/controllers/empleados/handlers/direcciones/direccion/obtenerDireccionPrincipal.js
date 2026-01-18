import { Direccion } from "../../../../../models/index.js";

/**
 * Obtener dirección principal del colaborador
 *
 * @param {Object} params
 * @param {number|string} params.id_colaborador
 * @returns {Promise<object>}
 */
export const obtenerDireccionPrincipal = async ({ id_colaborador }) => {
  const cid = Number(id_colaborador);
  if (!Number.isInteger(cid) || cid <= 0) throw new Error("id_colaborador inválido");

  const principal = await Direccion.findOne({
    where: {
      id_colaborador: cid,
      es_principal: true,
      estado: 1,
    },
  });

  if (!principal) throw new Error("El colaborador no tiene dirección principal activa");

  return principal;
};
