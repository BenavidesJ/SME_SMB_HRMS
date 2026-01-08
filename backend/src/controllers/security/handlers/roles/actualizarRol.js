import { sequelize, Rol } from "../../../../models/index.js";

export const actualizarRol = async ({ id, patch = {} }) => {
  const tx = await sequelize.transaction();
  try {
    const eid = Number(id);
    if (!Number.isInteger(eid) || eid <= 0) throw new Error("id inválido");

    const { nombre } = patch;
    if (nombre === undefined || String(nombre).trim() === "")
      throw new Error("El campo nombre es obligatorio");

    const txt = String(nombre).trim().toUpperCase();

    const dup = await Rol.findOne({
      where: { nombre: txt, id_rol: { [sequelize.Sequelize.Op.ne]: eid } },
      transaction: tx,
    });
    if (dup) throw new Error(`Ya existe un nombre: ${txt}`);

    const [updated] = await Rol.update(
      { nombre: txt },
      { where: { id_rol: eid }, transaction: tx }
    );
    if (!updated) throw new Error("Registro no encontrado / sin cambios");

    await tx.commit();
    return { id: eid, nombre: txt };
  } catch (e) { await tx.rollback(); throw e; }
};
