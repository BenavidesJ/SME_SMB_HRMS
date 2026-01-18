import { sequelize, EstadoCivil } from "../../../../models/index.js";

/**
 * Crear Estado Civil
 * 
 * @param {String} { 
 *      estado_civil, 
 *  }
 * @returns {Promise<object>}
 */
export const crearNuevoEstadoCivil = async (
  {
    estado_civil
  }) => {

  const tx = await sequelize.transaction();

  try {
    const exists = await EstadoCivil.findOne({
      where: { estado_civil },
      transaction: tx
    });

    if (exists) throw new Error(`Ya existe un estado civil: ${genero}`)

    const maritalStatusValue = estado_civil?.trim().toUpperCase();

    const newMaritalStatus = await EstadoCivil.create({
      estado_civil: maritalStatusValue
    }, { transaction: tx });

    await tx.commit();

    return {
      id: newMaritalStatus.id_estado_civil,
      estado_civil: newMaritalStatus.estado_civil,
    };

  } catch (error) {
    await tx.rollback();
    throw error;
  }
};