import { sequelize, Departamento, Puesto } from "../../../../../models/index.js";

/**
 * Elimina un departamento
 *
 * @param {{ id:number|string }} params
 * @returns {Promise<{id:number}>}
 */
export const eliminarDepartamento = async ({ id }) => {
  const tx = await sequelize.transaction();

  try {
    const did = Number(id);
    if (!Number.isInteger(did) || did <= 0) {
      throw new Error("id inválido; debe ser un entero positivo");
    }

    const dep = await Departamento.findByPk(did, { transaction: tx });
    if (!dep) throw new Error(`No existe un departamento con id ${did}`);

    const puestosAsociados = await Puesto.count({
      where: { id_departamento: did },
      transaction: tx,
    });

    if (puestosAsociados > 0) {
      throw new Error(
        `No se puede eliminar el departamento porque tiene ${puestosAsociados} puesto(s) asociado(s)`
      );
    }

    const deleted = await Departamento.destroy({
      where: { id_departamento: did },
      transaction: tx,
    });

    if (!deleted) throw new Error(`No existe un departamento con id ${did}`);

    await tx.commit();
    return { id: did };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};
