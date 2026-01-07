import { Genero } from "../../../../models/index.js";

export const actualizarGenero = async ({ id, patch = {} }) => {
  const gid = Number(id);
  if (!Number.isInteger(gid) || gid <= 0) {
    throw new Error("id inválido");
  }
  const { genero } = patch;
  if (genero === undefined || String(genero).trim() === "") {
    throw new Error("El campo género es obligatorio");
  }
  const nuevoTexto = String(genero).trim().toUpperCase();
  const [updated] = await Genero.update(
    { genero: nuevoTexto },
    { where: { id_genero: gid } }
  );
  if (!updated) throw new Error("Registro no encontrado / sin cambios");
  return { id: gid, genero: nuevoTexto };
};
