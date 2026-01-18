import { TipoMarca } from "../../../../models/index.js";

/**
 * Obtener Tipo Marca por ID
 *
 * @param {{ id_tipo_marca: number|string }} payload
 * @returns {Promise<{id:number, tipo:string}>}
 */
export const obtenerTipoMarcaPorId = async ({ id_tipo_marca }) => {
  const id = Number(String(id_tipo_marca).trim());
  if (!Number.isFinite(id)) throw new Error("id_tipo_marca debe ser numérico");

  const tipo = await TipoMarca.findByPk(id, {
    attributes: ["id_tipo_marca", "nombre"],
  });

  if (!tipo) throw new Error(`No existe tipo de marca con id ${id}`);

  return {
    id: tipo.id_tipo_marca,
    tipo: tipo.nombre,
  };
};
