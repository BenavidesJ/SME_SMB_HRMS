import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createDepartamento } from "../handlers/create.js";
import { deleteDepartamento } from "../handlers/delete.js";
import { getDepartamento, listDepartamentos } from "../handlers/read.js";
import { updateDepartamento } from "../handlers/update.js";

export const departamentoControllers = buildCrudControllers({
  singular: "Departamento",
  plural: "Departamentos",
  createHandler: createDepartamento,
  listHandler: listDepartamentos,
  detailHandler: getDepartamento,
  updateHandler: updateDepartamento,
  deleteHandler: deleteDepartamento,
});
