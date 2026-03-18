import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
	solicitarPermisoController,
	actualizarEstadoSolicitudPermisoController,
	listarPermisosController,
	listarPermisosPorColaboradorController,
} from "../modules/permisos/permisos.controller.js";

const router = Router();

router.post("/", authorization, solicitarPermisoController);
router.get("/solicitudes", authorization, listarPermisosController);
router.get("/colaborador/:id_colaborador", authorization, listarPermisosPorColaboradorController);
router.patch("/solicitud/:id", authorization, actualizarEstadoSolicitudPermisoController);

export default router;
