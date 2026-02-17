import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

const serialize = (deduccion) => ({
  id: deduccion.id_deduccion,
  nombre: deduccion.nombre,
  valor: Number(deduccion.valor),
  es_voluntaria: Boolean(deduccion.es_voluntaria),
});

export const listDeducciones = async () =>
  (await models.Deduccion.findAll({ order: [["id_deduccion", "ASC"]] })).map(serialize);

export const getDeduccion = async ({ id }) => {
  const did = requirePositiveInt(id, "id");
  const deduccion = await models.Deduccion.findByPk(did);
  if (!deduccion) throw new Error(`No existe deducción con id ${did}`);
  return serialize(deduccion);
};
