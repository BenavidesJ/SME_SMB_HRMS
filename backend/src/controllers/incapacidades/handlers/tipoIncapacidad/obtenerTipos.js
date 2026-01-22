import { TipoIncapacidad } from "../../../../models/index.js";

/**
 * Lista todos los tipos de incapacidad
 */
export const obtenerTiposIncapacidad = async () => {
  const rows = await TipoIncapacidad.findAll({
    order: [["id_tipo_incap", "ASC"]],
  });

  return rows.map((r) => ({
    id: r.id_tipo_incap,
    nombre: r.nombre,
  }));
};
