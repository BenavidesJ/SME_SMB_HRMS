import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createPuesto } from "../handlers/create.js";
import { deletePuesto } from "../handlers/delete.js";
import { getPuesto, listPuestos } from "../handlers/read.js";
import { updatePuesto } from "../handlers/update.js";

export const puestoControllers = buildCrudControllers({
  singular: "Puesto",
  plural: "Puestos",
  createHandler: createPuesto,
  listHandler: listPuestos,
  detailHandler: getPuesto,
  updateHandler: updatePuesto,
  deleteHandler: deletePuesto,
});
