import { sequelize, TipoHoraExtra } from "../../../../models/index.js";
/**
 * Actualizar Tipo Hora Extra (PATCH)
 *
 * @param {{
 *   id_tipo_hx: number|string,
 *   nombre?: string,
 *   descripcion?: string,
 *   multiplicador?: number|string
 * }} payload
 * @returns {Promise<{id:number, nombre:string, descripcion:string, multiplicador:number}>}
 */
export const actualizarTipoHoraExtra = async ({
  id_tipo_hx,
  nombre,
  descripcion,
  multiplicador,
}) => {
  const tx = await sequelize.transaction();

  try {
    const id = Number(String(id_tipo_hx).trim());
    if (!Number.isFinite(id)) {
      throw new Error("id_tipo_hx debe ser numérico");
    }

    const current = await TipoHoraExtra.findByPk(id, { transaction: tx });
    if (!current) {
      throw new Error(`No existe tipo de hora extra con id ${id}`);
    }

    const updates = {};

    if (nombre !== undefined) {
      const nuevoNombre = String(nombre).trim().toUpperCase();
      if (!nuevoNombre) throw new Error("nombre no puede ser vacío");

      const exists = await TipoHoraExtra.findOne({
        where: { nombre: nuevoNombre },
        transaction: tx,
      });

      if (exists && exists.id_tipo_hx !== id) {
        throw new Error(`Ya existe un tipo de hora extra: ${nuevoNombre}`);
      }

      updates.nombre = nuevoNombre;
    }

    if (descripcion !== undefined) {
      const desc = String(descripcion).trim();
      if (!desc) throw new Error("descripcion no puede ser vacía");
      updates.descripcion = desc;
    }

    if (multiplicador !== undefined) {
      const mult = Number(multiplicador);
      if (!Number.isFinite(mult) || mult <= 0) {
        throw new Error("multiplicador debe ser numérico y mayor a 0");
      }
      updates.multiplicador = mult;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("Debe enviar al menos un campo para actualizar");
    }

    await current.update(updates, { transaction: tx });

    await tx.commit();

    return {
      id: current.id_tipo_hx,
      nombre: current.nombre,
      descripcion: current.descripcion,
      multiplicador: current.multiplicador,
    };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};