import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

const serialize = (registro) => ({
  id: registro.id_tipo_jornada,
  tipo: registro.tipo,
  max_horas_diarias: Number(registro.max_horas_diarias),
  max_horas_semanales: Number(registro.max_horas_semanales),
});

export const listTiposJornada = async () =>
  (await models.TipoJornada.findAll({ order: [["id_tipo_jornada", "ASC"]] })).map(serialize);

export const getTipoJornada = async ({ id }) => {
  const jid = requirePositiveInt(id, "id");
  const tipo = await models.TipoJornada.findByPk(jid);
  if (!tipo) throw new Error(`No existe tipo de jornada con id ${jid}`);
  return serialize(tipo);
};
