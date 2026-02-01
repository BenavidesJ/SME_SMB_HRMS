import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createEstado } from "../handlers/create.js";
import { deleteEstado } from "../handlers/delete.js";
import { getEstado, listEstados } from "../handlers/read.js";
import { updateEstado } from "../handlers/update.js";


export const estadoControllers = buildCrudControllers({
  singular: "Estado",
  plural: "Estados",
  createHandler: createEstado,
  listHandler: listEstados,
  detailHandler: getEstado,
  updateHandler: updateEstado,
  deleteHandler: deleteEstado,
});