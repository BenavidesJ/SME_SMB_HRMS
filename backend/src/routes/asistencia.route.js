import express from 'express';
import { authorization } from '../middlewares/authorization.js';
import { crearTipoMarca, marcarAsistencia, obtenerTodosTiposMarca, obtenerMarcasPorRango, obtenerTipoMarca, patchTipoMarca, deleteTipoMarca } from '../controllers/asistencia/asistencia.controller.js';


const router = express.Router();
// Módulo de Asistencia
router.post('/tipos_marca', authorization, crearTipoMarca);
router.get('/tipos_marca', authorization, obtenerTodosTiposMarca);
router.get('/tipos_marca/:id', authorization, obtenerTipoMarca);
router.patch('/tipos_marca/:id', authorization, patchTipoMarca);
router.delete('/tipos_marca/:id', authorization, deleteTipoMarca);

router.get('/marcas', authorization, obtenerMarcasPorRango);
router.post('/marca', authorization, marcarAsistencia);

export default router;