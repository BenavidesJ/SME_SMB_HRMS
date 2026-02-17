import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createProvincia } from "../handlers/create.js";
import { deleteProvincia } from "../handlers/delete.js";
import { getProvincia, listProvincias } from "../handlers/read.js";
import { updateProvincia } from "../handlers/update.js";

export const provinciaControllers = buildCrudControllers({
  singular: "Provincia",
  plural: "Provincias",
  createHandler: createProvincia,
  listHandler: listProvincias,
  detailHandler: getProvincia,
  updateHandler: updateProvincia,
  deleteHandler: deleteProvincia,
});
