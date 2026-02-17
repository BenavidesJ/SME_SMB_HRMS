import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
  createPeriodoPlanillaController,
  listPeriodosPlanillaController,
  getPeriodoPlanillaController,
  updatePeriodoPlanillaController,
  deletePeriodoPlanillaController,
  simularPlanillaController,
  generarPlanillaController,
  recalcularPlanillaController,
  obtenerDetallePlanillaController,
  eliminarPlanillaController,
  editarPlanillaController,
} from "../modules/planillas/planillas.controller.js";

const router = Router();

router.get("/periodo_planilla", authorization, listPeriodosPlanillaController);
router.post("/periodo_planilla", authorization, createPeriodoPlanillaController);
router.get("/periodo_planilla/:id", authorization, getPeriodoPlanillaController);
router.patch("/periodo_planilla/:id", authorization, updatePeriodoPlanillaController);
router.delete("/periodo_planilla/:id", authorization, deletePeriodoPlanillaController);

router.post("/simular", authorization, simularPlanillaController);
router.post("/detalle", authorization, obtenerDetallePlanillaController);
router.post("/", authorization, generarPlanillaController);
router.patch("/recalcular", authorization, recalcularPlanillaController);
router.delete("/:id", authorization, eliminarPlanillaController);
router.patch("/:id", authorization, editarPlanillaController);

export default router;
