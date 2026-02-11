import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createDeduccion } from "../handlers/create.js";
import { deleteDeduccion } from "../handlers/delete.js";
import { getDeduccion, listDeducciones } from "../handlers/read.js";
import { updateDeduccion } from "../handlers/update.js";

export const deduccionControllers = buildCrudControllers({
  singular: "Deducción",
  plural: "Deducciones",
  createHandler: createDeduccion,
  listHandler: listDeducciones,
  detailHandler: getDeduccion,
  updateHandler: updateDeduccion,
  deleteHandler: deleteDeduccion,
});
