import express from 'express';
import { borrarRol, cambioPassword, crearRol, login, obtenerRol, obtenerRoles, patchRol, resetPassword } from '../controllers/security/auth.controller.js';
import { authorization } from '../middlewares/authorization.js';

const router = express.Router();
// Inicio de Sesión
router.post('/login', login);
// Cambio de Contraseña
router.patch('/change-password', authorization, cambioPassword);
// Resetear Contraseña
router.patch('/forgot-password', resetPassword);
// Roles
router.post('/roles', authorization, crearRol);
router.get('/roles', authorization, obtenerRoles);
router.get('/roles/:id', authorization, obtenerRol);
router.patch('/roles/:id', authorization, patchRol);
router.delete('/roles/:id', authorization, borrarRol);

export default router;