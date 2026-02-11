import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const listEstados = async () =>
  (await models.Estado.findAll({ order: [["id_estado", "ASC"]] }))
    .map((estado) => ({ id: estado.id_estado, estado: estado.estado }));

export const getEstado = async ({ id }) => {
  const eid = requirePositiveInt(id, "id");
  const estado = await models.Estado.findByPk(eid);
  if (!estado) throw new Error(`No existe estado con id ${eid}`);
  return { id: estado.id_estado, estado: estado.estado };
};