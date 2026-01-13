import { EstadoCivil } from "../../../../models/index.js";

/**
 * Obtiene los datos de todos los estados civiles
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerEstadosCiviles = async () => {
  const maritalStatuses = await EstadoCivil.findAll();

  return maritalStatuses.map((m) => {
    return {
      id: m.id_estado_civil,
      estado_civil: m.estado_civil,
    };
  });;
};