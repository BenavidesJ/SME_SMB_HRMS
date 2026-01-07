import { EstadoCivil } from "../../../../models/index.js";

export const eliminarEstadoCivil = async ({ id }) => {
  const eid = Number(id);
  if (!Number.isInteger(eid) || eid <= 0) throw new Error("id inválido");

  const deleted = await EstadoCivil.destroy({ where: { id_estado_civil: eid } });
  if (!deleted) throw new Error(`No existe estado civil con id ${eid}`);

  return { id: eid };
};
