import express from 'express';
import { cambioPassword, crearRol, login, obtenerRoles, resetPassword } from '../controllers/security/auth.controller.js';
import { authorization } from '../middlewares/authorization.js';

const router = express.Router();
// Inicio de Sesión
router.post('/login', login);
// Obtener roles
router.get('/roles', authorization, obtenerRoles);
// Crear roles
router.post('/roles', authorization, crearRol);
// Cambio de Contraseña
router.patch('/change-password', authorization, cambioPassword);
// Resetear Contraseña
router.patch('/forgot-password', resetPassword);
// Verificar Cuenta
router.post('/verify', () => { });
// Refrescar token
router.post('/refresh', () => { });

export default router;