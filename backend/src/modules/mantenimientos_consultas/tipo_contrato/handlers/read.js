import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const listTiposContrato = async () =>
  (await models.TipoContrato.findAll({ order: [["id_tipo_contrato", "ASC"]] }))
    .map((registro) => ({ id: registro.id_tipo_contrato, tipo_contrato: registro.tipo_contrato }));

export const getTipoContrato = async ({ id }) => {
  const tid = requirePositiveInt(id, "id");
  const tipo = await models.TipoContrato.findByPk(tid);
  if (!tipo) throw new Error(`No existe tipo de contrato con id ${tid}`);
  return { id: tipo.id_tipo_contrato, tipo_contrato: tipo.tipo_contrato };
};
