import { TipoHoraExtra } from "../../../../models/index.js";
/**
 * Lista todos los tipos
 */
export const obtenerTiposHoraExtra = async () => {
  const rows = await TipoHoraExtra.findAll({
    order: [["id_tipo_hx", "ASC"]],
  });

  return rows.map((r) => ({
    id: r.id_tipo_hx,
    nombre: r.nombre,
    descripcion: r.descripcion,
    multiplicador: r.multiplicador,
  }));
};