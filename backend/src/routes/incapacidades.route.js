import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
	registrarIncapacidadController,
	listarIncapacidadesPorColaboradorController,
	extenderIncapacidadController,
} from "../modules/incapacidades/incapacidades.controller.js";

const router = Router();

router.post("/", authorization, registrarIncapacidadController);
router.get("/colaborador/:id", authorization, listarIncapacidadesPorColaboradorController);
router.patch("/:grupo", authorization, extenderIncapacidadController);

export default router;
