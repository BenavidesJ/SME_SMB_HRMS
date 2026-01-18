import { TipoContrato } from "../../../../../../models/index.js";

/**
 * Obtiene los datos de todos los tipos de contrato
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerTiposContrato = async () => {
  const contractTypes = await TipoContrato.findAll();

  return contractTypes.map((tc) => {
    return {
      id_tipo_contrato: tc.id_tipo_contrato,
      tipo_contrato: tc.tipo_contrato,
    };
  });
};
