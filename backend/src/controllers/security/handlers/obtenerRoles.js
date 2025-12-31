import { Rol } from "../../../models/index.js";

/**
 * Obtiene los datos de todos los roles
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerTodosRoles = async () => {
  const roles = await Rol.findAll();

  return roles.map((r) => {
    return r.nombre;
  });
};