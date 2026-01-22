import { sequelize, TipoIncapacidad } from "../../../../models/index.js";

/**
 * Actualizar Tipo Incapacidad
 *
 * @param {{
 *   id_tipo_incap: number|string,
 *   nombre?: string,
 * }} payload
 * @returns {Promise<{id:number, nombre:string }>}
 */
export const actualizarTipoIncapacidad = async ({ id_tipo_incap, nombre  }) => {
  const tx = await sequelize.transaction();

  try {
    const id = Number(String(id_tipo_incap).trim());
    if (!Number.isFinite(id)) {
      throw new Error("id_tipo_incap debe ser numérico");
    }

    const current = await TipoIncapacidad.findByPk(id, { transaction: tx });
    if (!current) {
      throw new Error(`No existe tipo de incapacidad con id ${id}`);
    }

    const updates = {};

    if (nombre !== undefined) {
      const nuevoNombre = String(nombre).trim().toUpperCase();
      if (!nuevoNombre) throw new Error("nombre no puede ser vacío");

      const exists = await TipoIncapacidad.findOne({
        where: { nombre: nuevoNombre },
        transaction: tx,
      });

      if (exists && exists.id_tipo_incap !== id) {
        throw new Error(`Ya existe un tipo de incapacidad: ${nuevoNombre}`);
      }

      updates.nombre = nuevoNombre;
    }


    if (Object.keys(updates).length === 0) {
      throw new Error("Debe enviar al menos un campo para actualizar");
    }

    await current.update(updates, { transaction: tx });

    await tx.commit();

    return {
      id: current.id_tipo_incap,
      nombre: current.nombre,
    };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
