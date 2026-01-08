import { sequelize, Rol } from "../../../../models/index.js";

/**
 * Crear Rol
 * 
 * @param {String} { 
 *      rol, 
 *  }
 * @returns {Promise<object>}
 */
export const crearNuevoRol = async (
  {
    nombre
  }) => {

  const tx = await sequelize.transaction();

  try {
    const exists = await Rol.findOne({
      where: { nombre },
      transaction: tx
    });

    if (exists) throw new Error(`Ya existe un rol: ${nombre}`)

    const roleValue = nombre?.trim().toUpperCase();

    const newRole = await Rol.create({
      nombre: roleValue
    }, { transaction: tx });

    await tx.commit();


    return {
      id: newRole.id_rol,
      rol: newRole.nombre,
    };

  } catch (error) {
    await tx.rollback();
    throw error;
  }
};