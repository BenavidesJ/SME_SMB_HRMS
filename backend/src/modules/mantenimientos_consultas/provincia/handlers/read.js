import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const listProvincias = async () =>
  (await models.Provincia.findAll({ order: [["id_provincia", "ASC"]] }))
    .map((provincia) => ({ id: provincia.id_provincia, nombre: provincia.nombre }));

export const getProvincia = async ({ id }) => {
  const pid = requirePositiveInt(id, "id");
  const provincia = await models.Provincia.findByPk(pid);
  if (!provincia) throw new Error(`No existe provincia con id ${pid}`);
  return { id: provincia.id_provincia, nombre: provincia.nombre };
};
