import { sequelize, Genero } from "../../../../models/index.js";

/**
 * Crear Genero
 * 
 * @param {String} { 
 *      genero, 
 *  }
 * @returns {Promise<object>}
 */
export const crearNuevoGenero = async (
  {
    genero
  }) => {

  const tx = await sequelize.transaction();

  try {
    const exists = await Genero.findOne({
      where: { genero },
      transaction: tx
    });

    if (exists) throw new Error(`Ya existe un genero: ${genero}`)

    const genderValue = genero?.trim().toUpperCase();

    const newGender = await Genero.create({
      genero: genderValue
    }, { transaction: tx });

    await tx.commit();


    return {
      id: newGender.id_genero,
      genero: newGender.genero,
    };

  } catch (error) {
    await tx.rollback();
    throw error;
  }
};