import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
	registrarIncapacidadController,
	listarIncapacidadesPorColaboradorController,
} from "../modules/incapacidades/incapacidades.controller.js";

const router = Router();

router.post("/", authorization, registrarIncapacidadController);
router.get("/colaborador/:id", authorization, listarIncapacidadesPorColaboradorController);

export default router;
