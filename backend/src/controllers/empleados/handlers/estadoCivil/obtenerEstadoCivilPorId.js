import { EstadoCivil } from "../../../../models/index.js";

export const obtenerEstadoCivilPorId = async ({ id }) => {
  const eid = Number(id);
  if (!Number.isInteger(eid) || eid <= 0) throw new Error("id inválido");

  const estadoCivil = await EstadoCivil.findByPk(eid);
  if (!estadoCivil) throw new Error(`No existe estado civil con id ${eid}`);

  return {
    id: estadoCivil.id_estado_civil,
    estado_civil: estadoCivil.estado_civil,
  };
};
