import { sequelize, TipoIncapacidad } from "../../../../models/index.js";

/**
 * Crea un TipoIncapacidad
 */
export const crearTipoIncapacidad = async ({ nombre, descripcion }) => {
  const tx = await sequelize.transaction();
  try {
    const exists = await TipoIncapacidad.findOne({
      where: sequelize.where(
        sequelize.fn("UPPER", sequelize.col("nombre")),
        String(nombre).trim().toUpperCase()
      ),
      transaction: tx,
    });

    if (exists) throw new Error(`Ya existe un tipo de incapacidad con nombre "${nombre}"`);

    const created = await TipoIncapacidad.create(
      {
        nombre: String(nombre).trim().toUpperCase(),
        descripcion: String(descripcion).trim(),
      },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id: created.id_tipo_incap,
      nombre: created.nombre,
      descripcion: created.descripcion,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
