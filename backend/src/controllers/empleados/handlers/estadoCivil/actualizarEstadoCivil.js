import { EstadoCivil } from "../../../../models/index.js";

export const actualizarEstadoCivil = async ({ id, patch = {} }) => {
  const eid = Number(id);
  if (!Number.isInteger(eid) || eid <= 0) throw new Error("id inválido");

  const { estado_civil } = patch;
  if (estado_civil === undefined || String(estado_civil).trim() === "")
    throw new Error("El campo estado_civil es obligatorio");

  const txt = String(estado_civil).trim().toUpperCase();

  const [updated] = await EstadoCivil.update(
    { estado_civil: txt },
    { where: { id_estado_civil: eid } }
  );
  if (!updated) throw new Error("Registro no encontrado / sin cambios");

  return { id: eid, estado_civil: txt };
};
