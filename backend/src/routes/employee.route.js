import express from 'express';
import { crearEmpleado, obtenerColaboradorPorUserId } from '../controllers/empleados/empleados.controller.js';
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

const router = express.Router();
// Empleados
router.post('/empleados', authorization, crearEmpleado);
router.get('/empleados/:id', authorization, obtenerColaboradorPorUserId);
// Direcciones
// - Provincias
router.post('/provincias', authorization, crearProvincia);
router.get('/provincias', authorization, obtenerProvincias);
router.get('/provincias/:id', authorization, obtenerProvincia);
// - Cantones
router.post('/cantones', authorization, crearCanton);
router.get('/cantones', authorization, obtenerCantonesPorProvincia);
// - Cantones
router.post('/distritos', authorization, crearDistrito);
router.get('/distritos', authorization, obtenerDistritoPorCanton);

export default router;