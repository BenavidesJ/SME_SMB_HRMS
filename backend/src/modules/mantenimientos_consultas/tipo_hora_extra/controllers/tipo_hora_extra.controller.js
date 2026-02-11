import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createTipoHoraExtra } from "../handlers/create.js";
import { deleteTipoHoraExtra } from "../handlers/delete.js";
import { getTipoHoraExtra, listTiposHoraExtra } from "../handlers/read.js";
import { updateTipoHoraExtra } from "../handlers/update.js";

export const tipoHoraExtraControllers = buildCrudControllers({
  singular: "Tipo de hora extra",
  plural: "Tipos de hora extra",
  createHandler: createTipoHoraExtra,
  listHandler: listTiposHoraExtra,
  detailHandler: getTipoHoraExtra,
  updateHandler: updateTipoHoraExtra,
  deleteHandler: deleteTipoHoraExtra,
});
