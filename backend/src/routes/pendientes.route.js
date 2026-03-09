import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import { obtenerPendientesAprobacionController } from "../modules/pendientes/controllers/pendientes.controller.js";

const router = Router();

router.get("/aprobaciones", authorization, obtenerPendientesAprobacionController);

export default router;
