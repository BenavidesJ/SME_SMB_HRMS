import { Distrito } from "../../../../../models/index.js";

export const eliminarDistrito = async ({ id }) => {
  const did = Number(id);
  if (!Number.isInteger(did) || did <= 0) throw new Error("id inválido");

  const deleted = await Distrito.destroy({ where: { id_distrito: did } });
  if (!deleted) throw new Error(`No existe distrito con id ${did}`);

  return { id_distrito: did };
};
