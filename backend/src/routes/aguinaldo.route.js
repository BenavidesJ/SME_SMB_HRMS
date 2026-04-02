import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
  calcularLoteAguinaldoController,
  crearLoteAguinaldoController,
  recalcularAguinaldosController,
  listarAguinaldosController,
  listarColaboradoresElegiblesAguinaldoController,
  obtenerDetalleAguinaldoController,
  listarPeriodosAguinaldoController,
  editarPeriodoAguinaldoController,
  eliminarPeriodoAguinaldoController,
} from "../modules/aguinaldo/aguinaldo.controller.js";

const router = Router();

router.get("/", authorization, listarAguinaldosController);
router.get("/periodos", authorization, listarPeriodosAguinaldoController);
router.get("/elegibles", authorization, listarColaboradoresElegiblesAguinaldoController);
router.get("/:id/detalle", authorization, obtenerDetalleAguinaldoController);
router.patch("/periodos/:periodoKey", authorization, editarPeriodoAguinaldoController);
router.delete("/periodos/:periodoKey", authorization, eliminarPeriodoAguinaldoController);
router.post("/calcular-lote", authorization, calcularLoteAguinaldoController);
router.post("/crear-lote", authorization, crearLoteAguinaldoController);
router.patch("/recalcular", authorization, recalcularAguinaldosController);

export default router;
