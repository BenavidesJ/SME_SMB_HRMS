import { sequelize, TipoMarca } from "../../../models/index.js";

/**
 * Crear Tipo Marca
 * 
 * @param {String} { 
 *      tipo, 
 *  }
 * @returns {Promise<object>}
 */
export const crearNuevoTipoMarca = async (
  {
    tipo
  }) => {

  const tx = await sequelize.transaction();

  try {
    const exists = await TipoMarca.findOne({
      where: { nombre: tipo },
      transaction: tx
    });

    if (exists) throw new Error(`Ya existe un tipo de marca: ${tipo}`)

    const checkTypeValue = tipo?.trim().toUpperCase();

    const newCheckType = await TipoMarca.create({
      nombre: checkTypeValue
    }, { transaction: tx });

    await tx.commit();


    return {
      id: newCheckType.id_tipo_marca,
      tipo_marca: newCheckType.nombre,
    };

  } catch (error) {
    await tx.rollback();
    throw error;
  }
};