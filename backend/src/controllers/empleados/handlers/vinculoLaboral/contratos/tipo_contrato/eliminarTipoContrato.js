import { sequelize, TipoContrato } from "../../../../../../models/index.js";

export const eliminarTipoContrato = async ({ id }) => {
  const tx = await sequelize.transaction();
  try {
    const found = await TipoContrato.findByPk(id, { transaction: tx });
    if (!found) throw new Error(`No existe el tipo de contrato con id: ${id}`);

    await found.destroy({ transaction: tx });
    await tx.commit();

    return { id_tipo_contrato: Number(id) };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
};
