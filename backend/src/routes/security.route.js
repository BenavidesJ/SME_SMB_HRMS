import express from 'express';
import { login } from '../controllers/security/auth.controller.js';

const router = express.Router();
// Inicio de Sesión
router.post('/login', login);
// Resetear Contraseña
router.post('/forgot-password', ()=>{});
// Verificar Cuenta
router.post('/verify', ()=>{});
// Refrescar token
router.post('/refresh', ()=>{});

export default router;