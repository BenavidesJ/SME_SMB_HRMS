import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import { getCalendarioEventosController } from "../modules/calendario/controllers/calendario.controller.js";

const router = Router();

router.get("/eventos", authorization, getCalendarioEventosController);

export default router;
