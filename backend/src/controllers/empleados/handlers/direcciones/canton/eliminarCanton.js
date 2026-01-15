import { Canton } from "../../../../../models/index.js";

export const eliminarCanton = async ({ id }) => {
  const cid = Number(id);
  if (!Number.isInteger(cid) || cid <= 0) throw new Error("id inválido");

  const deleted = await Canton.destroy({ where: { id_canton: cid } });
  if (!deleted) throw new Error(`No existe cantón con id ${cid}`);

  return { id_canton: cid };
};
