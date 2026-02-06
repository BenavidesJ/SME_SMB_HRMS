import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
  createPeriodoPlanillaController,
  listPeriodosPlanillaController,
  getPeriodoPlanillaController,
  updatePeriodoPlanillaController,
  deletePeriodoPlanillaController,
  generarPlanillaController,
  obtenerDetallePlanillaController,
} from "../modules/planillas/planillas.controller.js";

const router = Router();

router.get("/periodo_planilla", authorization, listPeriodosPlanillaController);
router.post("/periodo_planilla", authorization, createPeriodoPlanillaController);
router.get("/periodo_planilla/:id", authorization, getPeriodoPlanillaController);
router.patch("/periodo_planilla/:id", authorization, updatePeriodoPlanillaController);
router.delete("/periodo_planilla/:id", authorization, deletePeriodoPlanillaController);

router.post("/detalle", authorization, obtenerDetallePlanillaController);
router.post("/", authorization, generarPlanillaController);

export default router;
