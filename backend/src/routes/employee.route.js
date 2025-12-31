import express from 'express';
import { crearEmpleado, obtenerColaboradorPorUserId, obtenerTodosColaboradores } from '../controllers/empleados/empleados.controller.js';
import {
  crearCanton,
  crearDistrito,
  crearProvincia,
  obtenerCantonesPorProvincia,
  obtenerDistritoPorCanton,
  obtenerProvincia,
  obtenerProvincias
} from '../controllers/empleados/direcciones.controller.js';
import { authorization } from '../middlewares/authorization.js';
import { crearGenero, obtenerTodosGeneros } from '../controllers/empleados/generos.controller.js';
import { crearEstadoCivil, obtenerTodosEstadosCiviles } from '../controllers/empleados/estadoCivil.controller.js';

const router = express.Router();
// Empleados
router.post('/empleados', authorization, crearEmpleado);
router.get('/empleados', authorization, obtenerTodosColaboradores);
router.get('/empleados/:id', authorization, obtenerColaboradorPorUserId);
// - Generos
router.post('/generos', authorization, crearGenero);
router.get('/generos', authorization, obtenerTodosGeneros);
// - Estado civil
router.post('/estado_civil', authorization, crearEstadoCivil);
router.get('/estado_civil', authorization, obtenerTodosEstadosCiviles);
// Direcciones
// - Provincias
router.post('/provincias', authorization, crearProvincia);
router.get('/provincias', authorization, obtenerProvincias);
router.get('/provincias/:id', authorization, obtenerProvincia);
// - Cantones
router.post('/cantones', authorization, crearCanton);
router.get('/cantones', authorization, obtenerCantonesPorProvincia);
// - Distritos
router.post('/distritos', authorization, crearDistrito);
router.get('/distritos', authorization, obtenerDistritoPorCanton);

export default router;