import { Genero } from "../../../../models/index.js";

/**
 * Obtiene los datos de todos los generos
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerGeneros = async () => {
  const genders = await Genero.findAll();

  return genders.map((g) => {
    return g.genero;
  });
};
