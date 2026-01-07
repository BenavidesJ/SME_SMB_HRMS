import { sequelize, Estado } from "../../../models/index.js";

export const actualizarEstado = async ({ id, patch = {} }) => {
  const tx = await sequelize.transaction();
  try {
    const eid = Number(id);
    if (!Number.isInteger(eid) || eid <= 0) throw new Error("id inválido");

    const { estado } = patch;
    if (estado === undefined || String(estado).trim() === "")
      throw new Error("El campo estado es obligatorio");

    const txt = String(estado).trim().toUpperCase();

    const dup = await Estado.findOne({
      where: { estado: txt, id_estado: { [sequelize.Sequelize.Op.ne]: eid } },
      transaction: tx,
    });
    if (dup) throw new Error(`Ya existe un estado: ${txt}`);

    const [updated] = await Estado.update(
      { estado: txt },
      { where: { id_estado: eid }, transaction: tx }
    );
    if (!updated) throw new Error("Registro no encontrado / sin cambios");

    await tx.commit();
    return { id: eid, estado: txt };
  } catch (e) { await tx.rollback(); throw e; }
};
