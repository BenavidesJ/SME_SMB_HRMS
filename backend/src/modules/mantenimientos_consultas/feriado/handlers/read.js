import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

const serialize = (feriado) => ({
  id: feriado.id_feriado,
  fecha: feriado.fecha,
  nombre: feriado.nombre,
  es_obligatorio: Boolean(feriado.es_obligatorio),
});

export const listFeriados = async () =>
  (await models.Feriado.findAll({ order: [["fecha", "ASC"], ["id_feriado", "ASC"]] })).map(serialize);

export const getFeriado = async ({ id }) => {
  const fid = requirePositiveInt(id, "id");
  const feriado = await models.Feriado.findByPk(fid);
  if (!feriado) throw new Error(`No existe feriado con id ${fid}`);
  return serialize(feriado);
};
