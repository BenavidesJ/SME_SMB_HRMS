import { Rol } from "../../../../models/index.js";

export const obtenerRolPorId = async ({ id }) => {
  const eid = Number(id);
  if (!Number.isInteger(eid) || eid <= 0) throw new Error("id inválido");

  const est = await Rol.findByPk(eid);
  if (!est) throw new Error(`No existe rol con id ${eid}`);

  return { id: est.id_rol, nombre: est.nombre };
};
