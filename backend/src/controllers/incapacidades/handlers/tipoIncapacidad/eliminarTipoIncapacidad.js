import { sequelize, TipoIncapacidad, Incapacidad } from "../../../../models/index.js";

/**
 * Eliminar Tipo Incapacidad
 *
 * @param {{ id_tipo_incap: number|string }} payload
 * @returns {Promise<{id:number, deleted:boolean}>}
 */
export const eliminarTipoIncapacidad = async ({ id_tipo_incap }) => {
  const tx = await sequelize.transaction();

  try {
    const id = Number(String(id_tipo_incap).trim());
    if (!Number.isFinite(id)) {
      throw new Error("id_tipo_incap debe ser numérico");
    }

    const current = await TipoIncapacidad.findByPk(id, {
      attributes: ["id_tipo_incap", "nombre"],
      transaction: tx,
    });

    if (!current) {
      throw new Error(`No existe tipo de incapacidad con id ${id}`);
    }

    // Ajustá este modelo/where si tu tabla de incapacidades se llama distinto.
    const enUso = await Incapacidad?.findOne?.({
      where: { id_tipo_incap: id },
      attributes: ["id_incapacidad"],
      transaction: tx,
    });

    if (enUso) {
      const err = new Error(
        `No se puede eliminar el tipo de incapacidad "${current.nombre}" porque está en uso`
      );
      err.statusCode = 409;
      throw err;
    }

    await current.destroy({ transaction: tx });

    await tx.commit();
    return { id, deleted: true };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
