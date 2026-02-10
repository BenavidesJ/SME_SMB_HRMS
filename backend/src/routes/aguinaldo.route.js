import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
  calcularLoteAguinaldoController,
  crearLoteAguinaldoController,
  recalcularAguinaldosController,
  listarAguinaldosController,
} from "../modules/aguinaldo/aguinaldo.controller.js";

const router = Router();

router.get("/", authorization, listarAguinaldosController);
router.post("/calcular-lote", authorization, calcularLoteAguinaldoController);
router.post("/crear-lote", authorization, crearLoteAguinaldoController);
router.patch("/recalcular", authorization, recalcularAguinaldosController);

export default router;
