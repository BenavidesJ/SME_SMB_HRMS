import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const listEstadosCiviles = async () =>
  (await models.EstadoCivil.findAll({ order: [["id_estado_civil", "ASC"]] }))
    .map((registro) => ({ id: registro.id_estado_civil, estado_civil: registro.estado_civil }));

export const getEstadoCivil = async ({ id }) => {
  const eid = requirePositiveInt(id, "id");
  const estado = await models.EstadoCivil.findByPk(eid);
  if (!estado) throw new Error(`No existe estado civil con id ${eid}`);
  return { id: estado.id_estado_civil, estado_civil: estado.estado_civil };
};
