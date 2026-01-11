import { sequelize, TipoMarca } from "../../../../models/index.js";

/**
 * Actualizar Tipo Marca
 *
 * @param {{ id_tipo_marca: number|string, tipo: string }} payload
 * @returns {Promise<{id:number, tipo:string}>}
 */
export const actualizarTipoMarca = async ({ id_tipo_marca, tipo }) => {
  const tx = await sequelize.transaction();

  try {
    const id = Number(String(id_tipo_marca).trim());
    if (!Number.isFinite(id)) throw new Error("id_tipo_marca debe ser numérico");

    const nuevoTipo = String(tipo ?? "").trim().toUpperCase();
    if (!nuevoTipo) throw new Error("tipo es obligatorio");

    const current = await TipoMarca.findByPk(id, { transaction: tx });
    if (!current) throw new Error(`No existe tipo de marca con id ${id}`);

    // Evitar duplicados
    const exists = await TipoMarca.findOne({
      where: { nombre: nuevoTipo },
      transaction: tx,
    });

    if (exists && exists.id_tipo_marca !== id) {
      throw new Error(`Ya existe un tipo de marca: ${nuevoTipo}`);
    }

    await current.update({ nombre: nuevoTipo }, { transaction: tx });

    await tx.commit();

    return { id: current.id_tipo_marca, tipo: current.nombre };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
