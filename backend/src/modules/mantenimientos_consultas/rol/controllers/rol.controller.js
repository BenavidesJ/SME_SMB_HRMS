import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createRol } from "../handlers/create.js";
import { deleteRol } from "../handlers/delete.js";
import { getRol, listRoles } from "../handlers/read.js";
import { updateRol } from "../handlers/update.js";

export const rolControllers = buildCrudControllers({
  singular: "Rol",
  plural: "Roles",
  createHandler: createRol,
  listHandler: listRoles,
  detailHandler: getRol,
  updateHandler: updateRol,
  deleteHandler: deleteRol,
});
