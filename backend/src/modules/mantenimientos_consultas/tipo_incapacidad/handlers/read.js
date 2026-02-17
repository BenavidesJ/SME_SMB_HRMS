import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

const serialize = (registro) => ({ id: registro.id_tipo_incap, nombre: registro.nombre });

export const listTiposIncapacidad = async () =>
  (await models.TipoIncapacidad.findAll({ order: [["id_tipo_incap", "ASC"]] })).map(serialize);

export const getTipoIncapacidad = async ({ id }) => {
  const iid = requirePositiveInt(id, "id");
  const tipo = await models.TipoIncapacidad.findByPk(iid);
  if (!tipo) throw new Error(`No existe tipo de incapacidad con id ${iid}`);
  return serialize(tipo);
};
