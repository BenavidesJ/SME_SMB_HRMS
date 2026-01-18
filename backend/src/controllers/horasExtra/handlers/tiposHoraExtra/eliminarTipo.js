import { sequelize, TipoHoraExtra, SolicitudHoraExtra } from "../../../../models/index.js";

/**
 * Eliminar Tipo Hora Extra
 *
 * @param {{ id_tipo_hx: number|string }} payload
 * @returns {Promise<{id:number, deleted:boolean}>}
 */
export const eliminarTipoHoraExtra = async ({ id_tipo_hx }) => {
  const tx = await sequelize.transaction();

  try {
    const id = Number(String(id_tipo_hx).trim());
    if (!Number.isFinite(id)) {
      throw new Error("id_tipo_hx debe ser numérico");
    }

    const current = await TipoHoraExtra.findByPk(id, {
      attributes: ["id_tipo_hx", "nombre"],
      transaction: tx,
    });

    if (!current) {
      throw new Error(`No existe tipo de hora extra con id ${id}`);
    }

    const enUso = await SolicitudHoraExtra.findOne({
      where: { id_tipo_hx: id },
      attributes: ["id_solicitud_hx"],
      transaction: tx,
    });

    if (enUso) {
      const err = new Error(
        `No se puede eliminar el tipo de hora extra "${current.nombre}" porque está en uso`
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
