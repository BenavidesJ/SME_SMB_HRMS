import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
	crearSolicitudHorasExtra,
	actualizarSolicitudHorasExtra,
	obtenerSolicitudesHorasExtra,
} from "../modules/horas_extra/controllers/solicitudes.controller.js";

const router = Router();

router.get("/solicitudes", authorization, obtenerSolicitudesHorasExtra);
router.post("/solicitud", authorization, crearSolicitudHorasExtra);
router.patch("/solicitud/:id", authorization, actualizarSolicitudHorasExtra);

export default router;
