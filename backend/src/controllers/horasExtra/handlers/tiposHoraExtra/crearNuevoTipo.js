import { sequelize, TipoHoraExtra } from "../../../../models/index.js";
/**
 * Crea un TipoHoraExtra
 */
export const crearTipoHoraExtra = async ({ nombre, descripcion, multiplicador }) => {
  const tx = await sequelize.transaction();
  try {

    const exists = await TipoHoraExtra.findOne({
      where: sequelize.where(
        sequelize.fn("UPPER", sequelize.col("nombre")),
        String(nombre).trim().toUpperCase(),
      ),
      transaction: tx,
    });

    if (exists) throw new Error(`Ya existe un tipo de hora extra con nombre "${nombre}"`);

    const created = await TipoHoraExtra.create(
      {
        nombre: String(nombre).trim().toUpperCase(),
        descripcion: String(descripcion).trim(),
        multiplicador,
      },
      { transaction: tx },
    );

    await tx.commit();

    return {
      id: created.id_tipo_hx,
      nombre: created.nombre,
      descripcion: created.descripcion,
      multiplicador: created.multiplicador,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};