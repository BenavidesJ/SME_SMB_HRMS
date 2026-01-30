import { sequelize, PeriodoPlanilla, Estado } from "../../../../models/index.js";

/**
 * Desactivar un Periodo de Planilla
 *
 * @param {{ id_periodo: number|string }} payload
 * @returns {Promise<{id:number, deleted:boolean}>}
 */
export const desactivarPeriodo = async ({ id_periodo }) => {
  const tx = await sequelize.transaction();

  try {
    const id = Number(String(id_periodo).trim());

    if (!Number.isFinite(id) || id <= 0) {
      throw new Error("id_periodo debe ser un número entero positivo");
    }

    const current = await PeriodoPlanilla.findByPk(id, {
      attributes: ["id_periodo", "descripcion"],
      transaction: tx,
    });

    if (!current) {
      throw new Error(`No existe periodo de planilla con id ${id}`);
    }

    // Obtener estado INACTIVO
    const estadoInactivo = await Estado.findOne({
      where: { estado: "INACTIVO" },
      transaction: tx,
    });

    if (!estadoInactivo) {
      throw new Error('No existe Estado con estado="INACTIVO" en el catálogo');
    }

    await current.update(
      { estado: estadoInactivo.id_estado },
      { transaction: tx }
    );

    await tx.commit();

    return { id, deleted: true };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
