import express from 'express';
import { authorization } from '../middlewares/authorization.js';
import { crearTipoMarca, marcarAsistencia, obtenerTodosTiposMarca } from '../controllers/asistencia/asistencia.controller.js';


const router = express.Router();
// Módulo de Asistencia
router.post('/tipos_marca', crearTipoMarca);
router.get('/tipos_marca', obtenerTodosTiposMarca);
router.post('/marca', marcarAsistencia);

export default router;