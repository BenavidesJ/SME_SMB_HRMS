import { Genero } from "../../../../models/index.js";

export const eliminarGenero = async ({ id }) => {
  const gid = Number(id);
  if (!Number.isInteger(gid) || gid <= 0) {
    throw new Error("id inválido");
  }
  const deleted = await Genero.destroy({ where: { id_genero: gid } });
  if (!deleted) throw new Error(`No existe género con id ${gid}`);
  return { id: gid };
};
