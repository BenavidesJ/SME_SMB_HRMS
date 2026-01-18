import { sequelize, Canton, Distrito } from "../../../../../models/index.js";

/**
 * Crear Distrito
 *
 * @param {Object} params
 * @param {number|string} params.id_distrito
 * @param {number|string} params.id_canton
 * @param {string} params.nombre
 * @returns {Promise<object>}
 */
export const crearDistrito = async ({ id_distrito, id_canton, nombre }) => {
  const tx = await sequelize.transaction();

  try {
    const did = Number(id_distrito);
    if (!Number.isInteger(did) || did <= 0) throw new Error("id_distrito inválido");

    const cid = Number(id_canton);
    if (!Number.isInteger(cid) || cid <= 0) throw new Error("id_canton inválido");

    if (nombre === undefined || String(nombre).trim() === "")
      throw new Error("El campo nombre es obligatorio");

    const txt = String(nombre).trim();

    const canton = await Canton.findByPk(cid, { transaction: tx });
    if (!canton) throw new Error(`No existe cantón con id ${cid}`);

    const existsById = await Distrito.findByPk(did, { transaction: tx });
    if (existsById) throw new Error(`Ya existe un distrito con id ${did}`);

    const existsCombo = await Distrito.findOne({
      where: { id_canton: cid, nombre: txt },
      transaction: tx,
    });
    if (existsCombo) throw new Error(`Ya existe un distrito llamado ${txt} en ese cantón`);

    const created = await Distrito.create(
      { id_distrito: did, id_canton: cid, nombre: txt },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id_distrito: created.id_distrito,
      id_canton: created.id_canton,
      nombre: created.nombre,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
