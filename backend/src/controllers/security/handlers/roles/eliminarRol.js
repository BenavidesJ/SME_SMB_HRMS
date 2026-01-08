import { Rol } from "../../../../models/index.js";

export const eliminarRol = async ({ id }) => {
  const eid = Number(id);
  if (!Number.isInteger(eid) || eid <= 0) throw new Error("id inválido");

  const deleted = await Rol.destroy({ where: { id_rol: eid } });
  if (!deleted) throw new Error(`No existe rol con id ${eid}`);

  return { id: eid };
};
