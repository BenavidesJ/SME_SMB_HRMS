import { Provincia } from "../../../../../models/index.js";

export const eliminarProvincia = async ({ id }) => {
  const pid = Number(id);
  if (!Number.isInteger(pid) || pid <= 0) throw new Error("id inválido");

  const deleted = await Provincia.destroy({ where: { id_provincia: pid } });
  if (!deleted) throw new Error(`No existe provincia con id ${pid}`);

  return { id_provincia: pid };
};
