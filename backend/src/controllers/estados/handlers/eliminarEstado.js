import { sequelize, Estado } from "../../../models/index.js";

export const eliminarEstado = async ({ id }) => {
  const eid = Number(id);
  if (!Number.isInteger(eid) || eid <= 0) throw new Error("id inválido");

  const deleted = await Estado.destroy({ where: { id_estado: eid } });
  if (!deleted) throw new Error(`No existe estado con id ${eid}`);

  return { id: eid };
};
