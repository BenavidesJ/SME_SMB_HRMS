import express from 'express';
import { crearEmpleado, obtenerColaboradorPorUserId } from '../controllers/empleados/empleados.controller.js';
import { authorization } from '../middlewares/authorization.js';

const router = express.Router();
// Creacion de Empleado
router.post('/empleados', authorization ,crearEmpleado);
router.get('/empleados/:id', authorization ,obtenerColaboradorPorUserId);

export default router;