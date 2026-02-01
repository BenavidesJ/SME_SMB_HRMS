import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const listDistritos = async () =>
  (await models.Distrito.findAll({ order: [["id_distrito", "ASC"]] }))
    .map((distrito) => ({ id: distrito.id_distrito, id_canton: distrito.id_canton, nombre: distrito.nombre }));

export const getDistrito = async ({ id }) => {
  const did = requirePositiveInt(id, "id");
  const distrito = await models.Distrito.findByPk(did);
  if (!distrito) throw new Error(`No existe distrito con id ${did}`);
  return { id: distrito.id_distrito, id_canton: distrito.id_canton, nombre: distrito.nombre };
};
