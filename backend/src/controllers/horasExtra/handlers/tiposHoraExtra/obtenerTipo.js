import { TipoHoraExtra } from "../../../../models/index.js";

export const obtenerTipoHoraExtraPorId = async ({ id_tipo_hx }) => {
  const row = await TipoHoraExtra.findByPk(id_tipo_hx);
  if (!row) throw new Error(`No existe el tipo de hora extra con id ${id_tipo_hx}`);

  return {
    id: row.id_tipo_hx,
    nombre: row.nombre,
    descripcion: row.descripcion,
    multiplicador: row.multiplicador,
  };
};