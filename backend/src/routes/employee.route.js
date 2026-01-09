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
import { borrarGenero, crearGenero, obtenerGenero, obtenerTodosGeneros, patchGenero } from '../controllers/empleados/generos.controller.js';
import { borrarEstadoCivil, crearEstadoCivil, obtenerEstadoCivil, obtenerTodosEstadosCiviles, patchEstadoCivil } from '../controllers/empleados/estadoCivil.controller.js';
import { borrarDepartamento, crearDepartamento, obtenerDepartamento, obtenerTodosDepartamentos, patchDepartamento } from '../controllers/empleados/departamentos.controller.js';
import { borrarPuesto, crearPuesto, obtenerPuesto, obtenerTodosPuestos, patchPuesto } from '../controllers/empleados/puestos.controller.js';
import { borrarTipoContrato, crearContrato, crearTipoContrato, editarContrato, obtenerContratosDeColaborador, obtenerTipoContrato, obtenerTodosTiposContrato, patchTipoContrato } from '../controllers/empleados/contratos.controller.js';
import { borrarTipoJornada, crearHorario, crearTipoJornada, modificarHorario, obtenerTipoJornada, obtenerTodosHorarios, obtenerTodosTiposJornada, patchTipoJornada } from '../controllers/empleados/jornadas.controller.js';

const router = express.Router();
// Gestión de Empleados
router.post('/empleados', authorization, crearEmpleado);
router.get('/empleados', authorization, obtenerTodosColaboradores);
router.get('/empleados/:id', authorization, obtenerColaboradorPorUserId);
// - Generos
router.post('/generos', authorization, crearGenero);
router.get('/generos', authorization, obtenerTodosGeneros);
router.get('/generos/:id', authorization, obtenerGenero);
router.patch('/generos/:id', authorization, patchGenero);
router.delete('/generos/:id', authorization, borrarGenero);
// - Estado civil
router.post('/estado_civil', authorization, crearEstadoCivil);
router.get('/estado_civil', authorization, obtenerTodosEstadosCiviles);
router.get('/estado_civil/:id', authorization, obtenerEstadoCivil);
router.patch('/estado_civil/:id', authorization, patchEstadoCivil);
router.delete('/estado_civil/:id', authorization, borrarEstadoCivil);

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

// Vínculo Laboral
// - Departamentos
router.post('/departamentos', authorization, crearDepartamento);
router.get('/departamentos', authorization, obtenerTodosDepartamentos);
router.get('/departamentos/:id', authorization, obtenerDepartamento);
router.patch('/departamentos/:id', authorization, patchDepartamento);
router.delete('/departamentos/:id', authorization, borrarDepartamento);
// - Puestos
router.post('/puestos', authorization, crearPuesto);
router.get('/puestos', authorization, obtenerTodosPuestos);
router.get('/puestos/:id', authorization, obtenerPuesto);
router.patch('/puestos/:id', authorization, patchPuesto);
router.patch('/puestos/:id', authorization, borrarPuesto);
// - Contratos
router.post('/contratos', authorization, crearContrato);
router.patch('/contratos/:id', authorization, editarContrato);
router.get('/contratos/colaborador/:id', authorization, obtenerContratosDeColaborador);
// Tipo Contrato
router.post('/tipos_contrato', authorization, crearTipoContrato);
router.get('/tipos_contrato', authorization, obtenerTodosTiposContrato);
router.get('/tipos_contrato/:id', authorization, obtenerTipoContrato);
router.patch('/tipos_contrato/:id', authorization, patchTipoContrato);
router.delete('/tipos_contrato/:id', authorization, borrarTipoContrato);
// - Jornada
router.post('/tipos_jornada', authorization, crearTipoJornada);
router.get('/tipos_jornada', authorization, obtenerTodosTiposJornada);
router.get('/tipos_jornada/:id', authorization, obtenerTipoJornada);
router.patch('/tipos_jornada/:id', authorization, patchTipoJornada);
router.delete('/tipos_jornada/:id', authorization, borrarTipoJornada);
// - Horarios
router.post('/horarios', authorization, crearHorario);
router.get('/horarios', authorization, obtenerTodosHorarios);
router.patch('/horarios/:id', authorization, modificarHorario);

export default router;