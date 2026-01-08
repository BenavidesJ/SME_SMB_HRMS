import { Departamento } from "../../../../../models/index.js";

/**
 * Obtiene todos los departamentos
 *
 * @returns {Promise<Array<{id:number, departamento:string}>>}
 */
export const obtenerDepartamentos = async () => {
  const deps = await Departamento.findAll({
    attributes: ["id_departamento", "nombre"],
    order: [["id_departamento", "DESC"]],
  });

  return deps.map((d) => ({
    id: d.id_departamento,
    departamento: d.nombre,
  }));
};
