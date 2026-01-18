import { Departamento } from "../../../../../models/index.js";

/**
 * Obtiene un departamento por id
 *
 * @param {{ id:number|string }} params
 * @returns {Promise<{id:number, departamento:string}>}
 */
export const obtenerDepartamentoPorId = async ({ id }) => {
  const did = Number(id);
  if (!Number.isInteger(did) || did <= 0) {
    throw new Error("id inválido; debe ser un entero positivo");
  }

  const dep = await Departamento.findByPk(did, {
    attributes: ["id_departamento", "nombre"],
  });

  if (!dep) throw new Error(`No existe un departamento con id ${did}`);

  return {
    id: dep.id_departamento,
    departamento: dep.nombre,
  };
};
