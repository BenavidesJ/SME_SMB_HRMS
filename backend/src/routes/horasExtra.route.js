import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import { actualizarTipoHoraExtraController, crearSolicitudesHorasExtra, crearTipoHoraExtraController, eliminarTipoHoraExtraController, obtenerAgrupamientoSolicitudesHorasExtra, obtenerTipoHoraExtraPorIdController, obtenerTiposHoraExtraController, patchSolicitudHorasExtra } from "../controllers/horasExtra/horasExtra.controller.js";

const router = Router();

router.post("/tipos", authorization, crearTipoHoraExtraController);
router.get("/tipos", authorization, obtenerTiposHoraExtraController);
router.get("/tipos/:id", authorization, obtenerTipoHoraExtraPorIdController);
router.patch("/tipos/:id", authorization, actualizarTipoHoraExtraController);
router.delete("/tipos/:id", authorization, eliminarTipoHoraExtraController);

router.post("/solicitud", authorization, crearSolicitudesHorasExtra);
router.get("/solicitudes", authorization, obtenerAgrupamientoSolicitudesHorasExtra);
router.patch("/solicitud/:id", authorization, patchSolicitudHorasExtra);

export default router;
