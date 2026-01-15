import { sequelize, Canton, Provincia } from "../../../../../models/index.js";

/**
 * Crear Canton
 *
 * @param {Object} params
 * @param {number|string} params.id_canton
 * @param {number|string} params.id_provincia
 * @param {string} params.nombre
 * @returns {Promise<object>}
 */
export const crearCanton = async ({ id_canton, id_provincia, nombre }) => {
  const tx = await sequelize.transaction();

  try {
    const cid = Number(id_canton);
    if (!Number.isInteger(cid) || cid <= 0) throw new Error("id_canton inválido");

    const pid = Number(id_provincia);
    if (!Number.isInteger(pid) || pid <= 0) throw new Error("id_provincia inválido");

    if (nombre === undefined || String(nombre).trim() === "")
      throw new Error("El campo nombre es obligatorio");

    const txt = String(nombre).trim();

    const provincia = await Provincia.findByPk(pid, { transaction: tx });
    if (!provincia) throw new Error(`No existe provincia con id ${pid}`);

    const existsById = await Canton.findByPk(cid, { transaction: tx });
    if (existsById) throw new Error(`Ya existe un cantón con id ${cid}`);

    const existsCombo = await Canton.findOne({
      where: { id_provincia: pid, nombre: txt },
      transaction: tx,
    });
    if (existsCombo) throw new Error(`Ya existe un cantón llamado ${txt} en esa provincia`);

    const created = await Canton.create(
      { id_canton: cid, id_provincia: pid, nombre: txt },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id_canton: created.id_canton,
      id_provincia: created.id_provincia,
      nombre: created.nombre,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
