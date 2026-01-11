import { TipoMarca } from "../../../../models/index.js";

/**
 * Obtiene los datos de todos los tipos de marca
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerTiposMarca = async () => {
  const checkType = await TipoMarca.findAll();

  return checkType.map((ct) => {
    return {
      id: ct.id_tipo_marca,
      tipo: ct.nombre
    };
  });
};