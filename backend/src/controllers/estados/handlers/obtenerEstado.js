import { Estado } from "../../../models/index.js";

export const obtenerEstadoPorId = async ({ id }) => {
  const eid = Number(id);
  if (!Number.isInteger(eid) || eid <= 0) throw new Error("id inválido");

  const est = await Estado.findByPk(eid);
  if (!est) throw new Error(`No existe estado con id ${eid}`);

  return { id: est.id_estado, estado: est.estado };
};
