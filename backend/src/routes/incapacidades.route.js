import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import { actualizarTipoIncapacidadController, crearTipoIncapacidadController, eliminarTipoIncapacidadController, getIncapacidadesByColaborador, getIncapacidadesByRango, obtenerTipoIncapacidadPorIdController, obtenerTiposIncapacidadController, patchIncapacidad, postIncapacidad } from "../controllers/incapacidades/incapacidades.controller.js";

const router = Router();

router.post("/", authorization, postIncapacidad);
router.patch("/:id", authorization, patchIncapacidad);
router.get("/colaborador/:id", authorization, getIncapacidadesByColaborador);
router.post("/", authorization, getIncapacidadesByRango);

router.post("/tipos", authorization, crearTipoIncapacidadController);
router.get("/tipos", authorization, obtenerTiposIncapacidadController);
router.get("/tipos/:id", authorization, obtenerTipoIncapacidadPorIdController);
router.patch("/tipos/:id", authorization, actualizarTipoIncapacidadController);
router.delete("/tipos/:id", authorization, eliminarTipoIncapacidadController);

export default router;
