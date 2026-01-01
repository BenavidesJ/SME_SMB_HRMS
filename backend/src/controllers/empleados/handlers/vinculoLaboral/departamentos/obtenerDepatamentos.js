import { Departamento } from "../../../../../models/index.js";


/**
 * Obtiene los datos de todos los departamentos
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerDepartamentos = async () => {
  const departments = await Departamento.findAll();

  return departments.map((d) => {
    return d.nombre;
  });
};
