import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createTipoJornada } from "../handlers/create.js";
import { deleteTipoJornada } from "../handlers/delete.js";
import { getTipoJornada, listTiposJornada } from "../handlers/read.js";
import { updateTipoJornada } from "../handlers/update.js";

export const tipoJornadaControllers = buildCrudControllers({
  singular: "Tipo de jornada",
  plural: "Tipos de jornada",
  createHandler: createTipoJornada,
  listHandler: listTiposJornada,
  detailHandler: getTipoJornada,
  updateHandler: updateTipoJornada,
  deleteHandler: deleteTipoJornada,
});
