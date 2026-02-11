import express from 'express';
import { authorization } from '../middlewares/authorization.js';
import { marcarAsistencia, obtenerEstadoMarcasDia, obtenerMarcasPorRango, patchMarcaAsistencia } from '../modules/asistencia/controllers/asistencia.controller.js';


const router = express.Router();
// Módulo de Asistencia

router.get('/marcas', authorization, obtenerMarcasPorRango);
router.get('/marcas/dia', authorization, obtenerEstadoMarcasDia);
router.post('/marca', authorization, marcarAsistencia);
router.patch('/marca', authorization, patchMarcaAsistencia);

export default router;