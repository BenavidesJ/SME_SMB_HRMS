import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createFeriado } from "../handlers/create.js";
import { deleteFeriado } from "../handlers/delete.js";
import { getFeriado, listFeriados } from "../handlers/read.js";
import { updateFeriado } from "../handlers/update.js";

export const feriadoControllers = buildCrudControllers({
  singular: "Feriado",
  plural: "Feriados",
  createHandler: createFeriado,
  listHandler: listFeriados,
  detailHandler: getFeriado,
  updateHandler: updateFeriado,
  deleteHandler: deleteFeriado,
});
