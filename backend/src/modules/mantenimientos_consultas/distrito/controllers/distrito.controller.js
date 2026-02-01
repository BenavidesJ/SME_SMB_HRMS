import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createDistrito } from "../handlers/create.js";
import { deleteDistrito } from "../handlers/delete.js";
import { getDistrito, listDistritos } from "../handlers/read.js";
import { updateDistrito } from "../handlers/update.js";

export const distritoControllers = buildCrudControllers({
  singular: "Distrito",
  plural: "Distritos",
  createHandler: createDistrito,
  listHandler: listDistritos,
  detailHandler: getDistrito,
  updateHandler: updateDistrito,
  deleteHandler: deleteDistrito,
});
