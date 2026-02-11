import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { createCausaLiquidacion } from "../handlers/create.js";
import { deleteCausaLiquidacion } from "../handlers/delete.js";
import { getCausaLiquidacion, listCausasLiquidacion } from "../handlers/read.js";
import { updateCausaLiquidacion } from "../handlers/update.js";

export const causaLiquidacionControllers = buildCrudControllers({
  singular: "Causa de liquidación",
  plural: "Causas de liquidación",
  createHandler: createCausaLiquidacion,
  listHandler: listCausasLiquidacion,
  detailHandler: getCausaLiquidacion,
  updateHandler: updateCausaLiquidacion,
  deleteHandler: deleteCausaLiquidacion,
});
