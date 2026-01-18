import { sequelize, TipoContrato } from "../../../../../../models/index.js";

/**
 * Crear Tipo Contrato
 * 
 * @param {String} { 
 *      tipo, 
 *  }
 * @returns {Promise<object>}
 */
export const crearNuevoTipoContrato = async (
  {
    tipo
  }) => {

  const tx = await sequelize.transaction();

  try {
    const exists = await TipoContrato.findOne({
      where: { tipo_contrato: tipo },
      transaction: tx
    });

    if (exists) throw new Error(`Ya existe un tipo de contrato: ${tipo}`)

    const contractTypeValue = tipo?.trim().toUpperCase();

    const newContractType = await TipoContrato.create({
      tipo_contrato: contractTypeValue
    }, { transaction: tx });

    await tx.commit();


    return {
      id: newContractType.id_tipo_contrato,
      tipo_contrato: newContractType.tipo_contrato,
    };

  } catch (error) {
    await tx.rollback();
    throw error;
  }
};