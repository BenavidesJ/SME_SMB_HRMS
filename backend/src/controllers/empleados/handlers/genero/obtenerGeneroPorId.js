import { Genero } from "../../../../models/index.js";

export const obtenerGeneroPorId = async ({ id }) => {
  const gid = Number(id);
  if (!Number.isInteger(gid) || gid <= 0) {
    throw new Error("id inválido");
  }
  const genero = await Genero.findByPk(gid);
  if (!genero) throw new Error(`No existe género con id ${gid}`);
  return genero;
};
