import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

const serialize = (registro) => ({ id: registro.id_tipo_marca, nombre: registro.nombre });

export const listTiposMarca = async () =>
  (await models.TipoMarca.findAll({ order: [["id_tipo_marca", "ASC"]] })).map(serialize);

export const getTipoMarca = async ({ id }) => {
  const mid = requirePositiveInt(id, "id");
  const tipo = await models.TipoMarca.findByPk(mid);
  if (!tipo) throw new Error(`No existe tipo de marca con id ${mid}`);
  return serialize(tipo);
};
