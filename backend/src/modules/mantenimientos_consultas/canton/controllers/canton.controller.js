import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createCanton } from "../handlers/create.js";
import { deleteCanton } from "../handlers/delete.js";
import { getCanton, listCantones } from "../handlers/read.js";
import { updateCanton } from "../handlers/update.js";

export const cantonControllers = buildCrudControllers({
  singular: "Cantón",
  plural: "Cantones",
  createHandler: createCanton,
  listHandler: listCantones,
  detailHandler: getCanton,
  updateHandler: updateCanton,
  deleteHandler: deleteCanton,
});
