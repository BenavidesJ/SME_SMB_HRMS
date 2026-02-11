import { Router } from "express";
import {
  simularLiquidacionController,
  crearLiquidacionController,
  listarLiquidacionesController,
  obtenerDetalleController,
  recalcularLiquidacionController,
  generarPDFController,
  exportarExcelController,
} from "../modules/liquidaciones/liquidaciones.controller.js";
import { authorization } from "../middlewares/authorization.js";

const router = Router();

// Rutas de liquidaciones
router.post("/simular", authorization, simularLiquidacionController);
router.post("/", authorization, crearLiquidacionController);
router.get("/", authorization, listarLiquidacionesController);
router.get("/:idCasoTermina", authorization, obtenerDetalleController);
router.patch("/:idCasoTermina", authorization, recalcularLiquidacionController);
router.get("/:idCasoTermina/pdf", authorization, generarPDFController);
router.get("/exportar/excel", authorization, exportarExcelController);

export default router;
