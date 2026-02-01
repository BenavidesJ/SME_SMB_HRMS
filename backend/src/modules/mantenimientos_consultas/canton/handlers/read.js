import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const listCantones = async () =>
  (await models.Canton.findAll({ order: [["id_canton", "ASC"]] }))
    .map((canton) => ({ id: canton.id_canton, id_provincia: canton.id_provincia, nombre: canton.nombre }));

export const getCanton = async ({ id }) => {
  const cid = requirePositiveInt(id, "id");
  const canton = await models.Canton.findByPk(cid);
  if (!canton) throw new Error(`No existe cantón con id ${cid}`);
  return { id: canton.id_canton, id_provincia: canton.id_provincia, nombre: canton.nombre };
};
