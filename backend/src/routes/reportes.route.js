import { Router } from "express";
import { authorization } from "../middlewares/authorization.js";
import {
  getCatalogoReportesController,
  getReporteDataController,
} from "../modules/reportes/reportes.controller.js";

const router = Router();

router.get("/", authorization, getCatalogoReportesController);
router.get("/:reporteKey", authorization, getReporteDataController);

export default router;
