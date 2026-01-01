import { sequelize, Departamento } from "../../../../../models/index.js";

/**
 * Crear Departamento
 * 
 * @param {String} { 
 *      nombre, 
 *  }
 * @returns {Promise<object>}
 */
export const crearNuevoDepartamento = async (
  {
    nombre
  }) => {

  const tx = await sequelize.transaction();

  try {
    const exists = await Departamento.findOne({
      where: { nombre },
      transaction: tx
    });

    if (exists) throw new Error(`Ya existe un departamento: ${nombre}`)

    const departmentValue = nombre?.trim().toUpperCase();

    const newDepartment = await Departamento.create({
      nombre: departmentValue
    }, { transaction: tx });

    await tx.commit();


    return {
      id: newDepartment.id_departamento,
      departamento: newDepartment.nombre,
    };

  } catch (error) {
    await tx.rollback();
    throw error;
  }
};