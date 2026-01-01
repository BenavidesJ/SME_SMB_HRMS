import { TipoContrato } from "../../../../../models/index.js";

/**
 * Obtiene los datos de todos los tipos de contrato
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerTiposContrato = async () => {
  const contractTypes = await TipoContrato.findAll();

  return contractTypes.map((tc) => {
    return tc.tipo_contrato;
  });
};
