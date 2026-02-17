import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createEstadoCivil } from "../handlers/create.js";
import { deleteEstadoCivil } from "../handlers/delete.js";
import { getEstadoCivil, listEstadosCiviles } from "../handlers/read.js";
import { updateEstadoCivil } from "../handlers/update.js";

export const estadoCivilControllers = buildCrudControllers({
  singular: "Estado civil",
  plural: "Estados civiles",
  createHandler: createEstadoCivil,
  listHandler: listEstadosCiviles,
  detailHandler: getEstadoCivil,
  updateHandler: updateEstadoCivil,
  deleteHandler: deleteEstadoCivil,
});
