import express from 'express';
import { authorization } from '../middlewares/authorization.js';
import {
  actualizarPeriodoController,
  crearCicloPago,
  crearPeriodoController,
  desactivarPeriodoController,
  generarDetallePlanillaController,
  obtenerDetallesPlanillaController,
  obtenerPeriodoController,
  obtenerPeriodosController,
  obtenerTodosCiclos,
  crearTipoDeduccionController,
  obtenerTiposDeduccionController,
  obtenerTipoDeduccionController,
  actualizarTipoDeduccionController,
  eliminarTipoDeduccionController,
} from "../controllers/planillas/planillas.controller.js";


const router = express.Router();
// Módulo de Calculo de Planillas
// Ciclos de pago
router.post('/ciclos_pago', authorization, crearCicloPago);
router.get('/ciclos_pago', authorization, obtenerTodosCiclos);
// Generar Planillas
router.post('/', authorization, generarDetallePlanillaController);
router.post('/detalle', authorization, obtenerDetallesPlanillaController);

// Generar Periodo de planillas
router.post('/periodo_planilla', authorization, crearPeriodoController);
router.get('/periodo_planilla', authorization, obtenerPeriodosController);
router.get('/periodo_planilla/:id', authorization, obtenerPeriodoController);
router.patch('/periodo_planilla/:id', authorization, actualizarPeriodoController);
router.patch('/periodo_planilla/:id/desactivar', authorization, desactivarPeriodoController);

// Tipos de deducción
router.post("/tipos_deduccion", authorization, crearTipoDeduccionController);
router.get("/tipos_deduccion", authorization, obtenerTiposDeduccionController);
router.get("/tipos_deduccion/:id", authorization, obtenerTipoDeduccionController);
router.patch("/tipos_deduccion/:id", authorization, actualizarTipoDeduccionController);
router.delete("/tipos_deduccion/:id", authorization, eliminarTipoDeduccionController);

export default router;