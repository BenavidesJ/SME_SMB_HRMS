import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createCicloPago } from "../handlers/create.js";
import { deleteCicloPago } from "../handlers/delete.js";
import { getCicloPago, listCiclosPago } from "../handlers/read.js";
import { updateCicloPago } from "../handlers/update.js";

export const cicloPagoControllers = buildCrudControllers({
  singular: "Ciclo de pago",
  plural: "Ciclos de pago",
  createHandler: createCicloPago,
  listHandler: listCiclosPago,
  detailHandler: getCicloPago,
  updateHandler: updateCicloPago,
  deleteHandler: deleteCicloPago,
});
