import { TipoJornada } from "../../../../../../models/index.js";

export const obtenerTipoJornadaPorId = async ({ id }) => {
  const found = await TipoJornada.findByPk(id);
  if (!found) throw new Error(`No existe el tipo de jornada con id: ${id}`);

  return {
    id_tipo_jornada: found.id_tipo_jornada,
    tipo: found.tipo,
    max_horas_diarias: found.max_horas_diarias,
    max_horas_semanales: found.max_horas_semanales,
  };
};
