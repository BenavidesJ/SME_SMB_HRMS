import { sequelize, TipoJornada } from "../../../../../../models/index.js";

export const eliminarTipoJornada = async ({ id }) => {
  const tx = await sequelize.transaction();
  try {
    const found = await TipoJornada.findByPk(id, { transaction: tx });
    if (!found) throw new Error(`No existe el tipo de jornada con id: ${id}`);

    await found.destroy({ transaction: tx });
    await tx.commit();

    return { id_tipo_jornada: Number(id) };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
};
