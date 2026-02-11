import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createTipoIncapacidad } from "../handlers/create.js";
import { deleteTipoIncapacidad } from "../handlers/delete.js";
import { getTipoIncapacidad, listTiposIncapacidad } from "../handlers/read.js";
import { updateTipoIncapacidad } from "../handlers/update.js";

export const tipoIncapacidadControllers = buildCrudControllers({
  singular: "Tipo de incapacidad",
  plural: "Tipos de incapacidad",
  createHandler: createTipoIncapacidad,
  listHandler: listTiposIncapacidad,
  detailHandler: getTipoIncapacidad,
  updateHandler: updateTipoIncapacidad,
  deleteHandler: deleteTipoIncapacidad,
});
