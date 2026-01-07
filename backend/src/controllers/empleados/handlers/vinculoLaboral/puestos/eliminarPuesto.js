import { sequelize, Puesto, Estado } from "../../../../../models/index.js";

/**
 * Marca un puesto como INACTIVO (borrado lógico)
 *
 * @param {{ id:number|string }} params
 * @returns {Promise<{id:number, estado:string}>}
 */
export const eliminarPuesto = async ({ id }) => {
  const tx = await sequelize.transaction();

  try {
    const pid = Number(id);
    if (!Number.isInteger(pid) || pid <= 0) {
      throw new Error("id inválido; debe ser un entero positivo");
    }

    const puesto = await Puesto.findByPk(pid, { transaction: tx });
    if (!puesto) throw new Error(`No existe un puesto con id ${pid}`);

    const inactivo = await Estado.findOne({
      where: { estado: "INACTIVO" },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });
    if (!inactivo) throw new Error('No se encontró el estado "INACTIVO" en catálogo Estado');

    if (puesto.estado === inactivo.id_estado) {
      await tx.rollback();
      return { id: pid, estado: inactivo.estado };
    }

    await puesto.update({ estado: inactivo.id_estado }, { transaction: tx });
    await tx.commit();

    return { id: pid, estado: inactivo.estado };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};
