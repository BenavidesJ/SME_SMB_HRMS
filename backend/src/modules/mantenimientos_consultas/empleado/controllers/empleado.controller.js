import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createEmpleado } from "../handlers/create.js";
import { listEmpleados, getEmpleado } from "../handlers/read.js";
import { updateEmpleado } from "../handlers/update.js";
import { deleteEmpleado } from "../handlers/delete.js";

export const empleadoControllers = buildCrudControllers({
  singular: "Empleado",
  plural: "Empleados",
  createHandler: createEmpleado,
  listHandler: listEmpleados,
  detailHandler: getEmpleado,
  updateHandler: updateEmpleado,
  deleteHandler: deleteEmpleado,
});
