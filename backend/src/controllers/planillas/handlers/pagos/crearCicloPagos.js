import { sequelize, CicloPago } from "../../../../models/index.js";

/**
 * Crear Ciclo de Pago
 * 
 * @param {String} { 
 *      nombre, 
 *  }
 * @returns {Promise<object>}
 */
export const crearNuevoCicloPago = async (
  {
    nombre
  }) => {

  const tx = await sequelize.transaction();

  try {
    const exists = await CicloPago.findOne({
      where: { nombre },
      transaction: tx
    });

    if (exists) throw new Error(`Ya existe un ciclo de pago: ${nombre}`)

    const cycleValue = nombre?.trim().toUpperCase();

    const newCycle = await CicloPago.create({
      nombre: cycleValue
    }, { transaction: tx });

    await tx.commit();


    return {
      id: newCycle.id_ciclo_pago,
      ciclo: newCycle.nombre,
    };

  } catch (error) {
    await tx.rollback();
    throw error;
  }
};