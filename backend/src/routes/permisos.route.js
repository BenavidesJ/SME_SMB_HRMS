import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import { crearTipo, eliminarTipo, getPermisosLicenciasPorColaborador, getPermisosLicenciasPorRango, modificarTipo, obtenerPorId, obtenerTodos, patchPermisoLicenciaEstado, postPermisoLicencia } from "../controllers/permisos/permisos.controller.js";

const router = Router();

router.post("/", authorization, postPermisoLicencia);
router.get("/colaborador/:id_colaborador", authorization, getPermisosLicenciasPorColaborador);
router.patch("/:id/estado", patchPermisoLicenciaEstado);
router.get("/", authorization, getPermisosLicenciasPorRango);

router.get("/tipos-solicitud", authorization, obtenerTodos);
router.get("/tipos-solicitud/:id", authorization, obtenerPorId);
router.post("/tipos-solicitud", authorization, crearTipo);
router.patch("/tipos-solicitud/:id", authorization, modificarTipo);
router.delete("/tipos-solicitud/:id", authorization, eliminarTipo);


export default router;
