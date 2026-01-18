import { sequelize, Estado } from "../../../models/index.js";

export const crearNuevoEstado = async ({ estado }) => {
  const tx = await sequelize.transaction();
  try {
    const txt = String(estado ?? "").trim().toUpperCase();
    if (!txt) throw new Error("El campo estado es obligatorio");

    const exists = await Estado.findOne({ where: { estado: txt }, transaction: tx });
    if (exists) throw new Error(`Ya existe un estado: ${txt}`);

    const created = await Estado.create({ estado: txt }, { transaction: tx });
    await tx.commit();

    return { id: created.id_estado, estado: created.estado };
  } catch (e) { await tx.rollback(); throw e; }
};
