import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createTipoMarca } from "../handlers/create.js";
import { deleteTipoMarca } from "../handlers/delete.js";
import { getTipoMarca, listTiposMarca } from "../handlers/read.js";
import { updateTipoMarca } from "../handlers/update.js";

export const tipoMarcaControllers = buildCrudControllers({
  singular: "Tipo de marca",
  plural: "Tipos de marca",
  createHandler: createTipoMarca,
  listHandler: listTiposMarca,
  detailHandler: getTipoMarca,
  updateHandler: updateTipoMarca,
  deleteHandler: deleteTipoMarca,
});
