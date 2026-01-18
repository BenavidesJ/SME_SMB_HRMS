import { TipoIncapacidad } from "../../../../models/index.js";

export const obtenerTipoIncapacidadPorId = async ({ id_tipo_incap }) => {
  const row = await TipoIncapacidad.findByPk(id_tipo_incap);
  if (!row) throw new Error(`No existe el tipo de incapacidad con id ${id_tipo_incap}`);

  return {
    id: row.id_tipo_incap,
    nombre: row.nombre,
    descripcion: row.descripcion,
  };
};
