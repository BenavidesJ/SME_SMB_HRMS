import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
	solicitarVacacionesController,
	listarVacacionesController,
	listarVacacionesPorColaboradorController,
	obtenerSaldoVacacionesController,
	actualizarEstadoSolicitudVacacionesController,
} from "../modules/vacaciones/vacaciones.controller.js";

const router = Router();

router.post("/", authorization, solicitarVacacionesController);
router.get("/solicitudes", authorization, listarVacacionesController);
router.get("/saldo/:id_colaborador", authorization, obtenerSaldoVacacionesController);
router.get("/colaborador/:id_colaborador", authorization, listarVacacionesPorColaboradorController);
router.patch("/solicitud/:id", authorization, actualizarEstadoSolicitudVacacionesController);

export default router;
