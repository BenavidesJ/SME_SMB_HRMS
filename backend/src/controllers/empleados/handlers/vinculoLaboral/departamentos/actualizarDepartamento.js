import { sequelize, Departamento } from "../../../../../models/index.js";

/**
 * Actualiza un departamento
 *
 *
 * @param {{ id:number|string, patch: { nombre?: string } }} params
 * @returns {Promise<{id:number, departamento:string}>}
 */
export const actualizarDepartamento = async ({ id, patch = {} }) => {
  const tx = await sequelize.transaction();

  try {
    const did = Number(id);
    if (!Number.isInteger(did) || did <= 0) throw new Error("id inválido");

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new Error("El body debe ser un objeto");
    }

    const allowed = new Set(["nombre"]);
    const keys = Object.keys(patch);

    if (keys.length === 0) throw new Error("No se enviaron campos a actualizar");
    for (const k of keys) {
      if (!allowed.has(k)) throw new Error(`Campo no permitido: ${k}`);
    }

    const current = await Departamento.findByPk(did, { transaction: tx });
    if (!current) throw new Error(`No existe un departamento con id ${did}`);

    if (patch.nombre === undefined || String(patch.nombre).trim() === "") {
      throw new Error("El campo nombre es obligatorio");
    }

    const nombreValue = String(patch.nombre).trim().toUpperCase();

    const dup = await Departamento.findOne({
      where: {
        nombre: nombreValue,
        id_departamento: { [sequelize.Sequelize.Op.ne]: did },
      },
      transaction: tx,
    });

    if (dup) throw new Error(`Ya existe un departamento: ${nombreValue}`);

    if (nombreValue === current.nombre) {
      throw new Error("Registro no encontrado / sin cambios");
    }

    await Departamento.update(
      { nombre: nombreValue },
      { where: { id_departamento: did }, transaction: tx }
    );

    await tx.commit();

    return {
      id: did,
      departamento: nombreValue,
    };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
};
