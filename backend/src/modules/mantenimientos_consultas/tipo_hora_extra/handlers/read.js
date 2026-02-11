import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

const serialize = (registro) => ({
  id: registro.id_tipo_hx,
  nombre: registro.nombre,
  multiplicador: Number(registro.multiplicador),
});

export const listTiposHoraExtra = async () =>
  (await models.TipoHoraExtra.findAll({ order: [["id_tipo_hx", "ASC"]] })).map(serialize);

export const getTipoHoraExtra = async ({ id }) => {
  const hid = requirePositiveInt(id, "id");
  const tipo = await models.TipoHoraExtra.findByPk(hid);
  if (!tipo) throw new Error(`No existe tipo de hora extra con id ${hid}`);
  return serialize(tipo);
};
