import { Direccion, Estado } from "../../../../../models/index.js";

/**
 * Desactivar Dirección (soft delete)
 *
 * @param {Object} params
 * @param {number|string} params.id
 * @returns {Promise<object>}
 */
export const desactivarDireccion = async ({ id }) => {
  const did = Number(id);
  if (!Number.isInteger(did) || did <= 0) throw new Error("id inválido");

  const direccion = await Direccion.findByPk(did);
  if (!direccion) throw new Error(`No existe dirección con id ${did}`);

  const inactivo = await Estado.findOne({
    where: { estado: "INACTIVO" },
  });

  if (!inactivo) {
    throw new Error(
      'No existe el estado "INACTIVO" en el catálogo. Verifique la tabla estado.'
    );
  }

  const [updated] = await Direccion.update(
    { estado: inactivo.id_estado, es_principal: false },
    { where: { id_direccion: did } }
  );

  if (!updated) throw new Error("Registro no encontrado / sin cambios");

  return { id_direccion: did, estado: inactivo.id_estado };
};
