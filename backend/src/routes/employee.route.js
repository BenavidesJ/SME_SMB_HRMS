import express from 'express';
import { crearEmpleado } from '../controllers/empleados/empleados.controller.js';
import { authorization } from '../middlewares/authorization.js';

const router = express.Router();
// Creacion de Empleado
router.post('/empleado', authorization ,crearEmpleado);

export default router;