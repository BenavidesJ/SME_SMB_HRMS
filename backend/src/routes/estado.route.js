import { Router } from "express";
import {
  crearEstado,
  obtenerTodosEstados,
  obtenerEstado,
  patchEstado,
  borrarEstado,
} from "../controllers/estados/estados.controller.js";
import { authorization } from "../middlewares/authorization.js";

const router = Router();

router.post("/", authorization, crearEstado);
router.get("/", authorization, obtenerTodosEstados);
router.get("/:id", authorization, obtenerEstado);
router.patch("/:id", authorization, patchEstado);
router.delete("/:id", authorization, borrarEstado);

export default router;
