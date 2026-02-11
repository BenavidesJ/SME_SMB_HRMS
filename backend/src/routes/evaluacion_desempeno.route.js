import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
  crearRubroController,
  obtenerRubrosController,
  eliminarRubroController,
  crearEvaluacionController,
  obtenerEvaluacionesController,
  obtenerEvaluacionPorIdController,
  finalizarEvaluacionController,
  obtenerEvaluacionesColaboradorController,
} from "../modules/evaluacion_desempeno/evaluacion.controller.js";

const router = Router();

// ─── Rubros ────────────────────────────────────────────────────────────────────
router.post("/rubros", authorization, crearRubroController);
router.get("/rubros", authorization, obtenerRubrosController);
router.delete("/rubros/:id", authorization, eliminarRubroController);

// ─── Evaluaciones ──────────────────────────────────────────────────────────────
router.post("/evaluaciones", authorization, crearEvaluacionController);
router.get("/evaluaciones", authorization, obtenerEvaluacionesController);
router.get("/evaluaciones/:id", authorization, obtenerEvaluacionPorIdController);
router.patch("/evaluaciones/:id/finalizar", authorization, finalizarEvaluacionController);

// ─── Evaluaciones por colaborador (para perfil del empleado) ───────────────────
router.get("/colaborador/:id_colaborador", authorization, obtenerEvaluacionesColaboradorController);

export default router;
