import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

const serialize = (departamento) => ({ id: departamento.id_departamento, nombre: departamento.nombre });

export const listDepartamentos = async () =>
  (await models.Departamento.findAll({ order: [["id_departamento", "ASC"]] })).map(serialize);

export const getDepartamento = async ({ id }) => {
  const did = requirePositiveInt(id, "id");
  const departamento = await models.Departamento.findByPk(did);
  if (!departamento) throw new Error(`No existe departamento con id ${did}`);
  return serialize(departamento);
};
