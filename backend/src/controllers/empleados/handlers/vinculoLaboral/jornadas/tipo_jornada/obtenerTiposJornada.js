import { TipoJornada } from "../../../../../../models/index.js";

/**
 * Obtiene los datos de todos los tipos de jornada
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerTiposJornada = async () => {
  const sheduleTypes = await TipoJornada.findAll();

  return sheduleTypes.map((sc) => {
    return {
      id: sc.id_tipo_jornada,
      tipo: sc.tipo,
      max_horas_diarias: sc.max_horas_diarias,
      max_horas_semanales: sc.max_horas_semanales
    };
  });
};
