import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createTipoContrato } from "../handlers/create.js";
import { deleteTipoContrato } from "../handlers/delete.js";
import { getTipoContrato, listTiposContrato } from "../handlers/read.js";
import { updateTipoContrato } from "../handlers/update.js";

export const tipoContratoControllers = buildCrudControllers({
  singular: "Tipo de contrato",
  plural: "Tipos de contrato",
  createHandler: createTipoContrato,
  listHandler: listTiposContrato,
  detailHandler: getTipoContrato,
  updateHandler: updateTipoContrato,
  deleteHandler: deleteTipoContrato,
});
