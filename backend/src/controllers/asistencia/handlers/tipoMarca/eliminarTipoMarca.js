import { sequelize, TipoMarca, MarcaAsistencia } from "../../../../models/index.js";

/**
 * Eliminar Tipo Marca 
 *
 * @param {{ id_tipo_marca: number|string }} payload
 * @returns {Promise<{id:number, deleted:boolean}>}
 */
export const eliminarTipoMarca = async ({ id_tipo_marca }) => {
  const tx = await sequelize.transaction();

  try {
    const id = Number(String(id_tipo_marca).trim());
    if (!Number.isFinite(id)) throw new Error("id_tipo_marca debe ser numérico");

    const current = await TipoMarca.findByPk(id, {
      attributes: ["id_tipo_marca", "nombre"],
      transaction: tx,
    });
    if (!current) throw new Error(`No existe tipo de marca con id ${id}`);

    const enUso = await MarcaAsistencia.findOne({
      where: { id_tipo_marca: id },
      attributes: ["id_marca"],
      transaction: tx,
    });

    if (enUso) {
      const err = new Error(
        `No se puede eliminar el tipo de marca "${current.nombre}" porque está en uso`
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
