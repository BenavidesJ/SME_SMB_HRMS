import { sequelize, Provincia } from "../../../../../models/index.js";

/**
 * Crear Provincia
 *
 * @param {Object} params
 * @param {number|string} params.id_provincia
 * @param {string} params.nombre
 * @returns {Promise<object>}
 */
export const crearProvincia = async ({ id_provincia, nombre }) => {
  const tx = await sequelize.transaction();

  try {
    const pid = Number(id_provincia);
    if (!Number.isInteger(pid) || pid <= 0) throw new Error("id_provincia inválido");

    if (nombre === undefined || String(nombre).trim() === "")
      throw new Error("El campo nombre es obligatorio");

    const txt = String(nombre).trim();

    const existsById = await Provincia.findByPk(pid, { transaction: tx });
    if (existsById) throw new Error(`Ya existe una provincia con id ${pid}`);

    const existsByName = await Provincia.findOne({
      where: { nombre: txt },
      transaction: tx,
    });
    if (existsByName) throw new Error(`Ya existe una provincia con nombre ${txt}`);

    const created = await Provincia.create(
      { id_provincia: pid, nombre: txt },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id_provincia: created.id_provincia,
      nombre: created.nombre,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
