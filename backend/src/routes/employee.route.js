import express from 'express';
import { authorization } from '../middlewares/authorization.js';
import { empleadoControllers } from '../modules/mantenimientos_consultas/empleado/empleado.controller.js';

const router = express.Router();
// Gestión de Empleados
router.post('/empleados', authorization, empleadoControllers.createController);
router.get('/empleados', authorization, empleadoControllers.listController);
router.get('/empleados/:id', authorization, empleadoControllers.detailController);
router.patch('/empleados/:id', authorization, empleadoControllers.updateController);

// // - Estado civil
// router.post('/estado_civil', authorization, crearEstadoCivil);
// router.get('/estado_civil', authorization, obtenerTodosEstadosCiviles);
// router.get('/estado_civil/:id', authorization, obtenerEstadoCivil);
// router.patch('/estado_civil/:id', authorization, patchEstadoCivil);
// router.delete('/estado_civil/:id', authorization, borrarEstadoCivil);

// // Direcciones
// router.post('/direccion', authorization, crearDireccionController);
// router.get('/direccion/principal', authorization, obtenerDireccionPrincipalController);
// router.get('/colaboradores/:id/direcciones', authorization, obtenerDireccionesPorColaboradorController);
// router.patch('/direcciones/:id', authorization, actualizarDireccionController);
// router.patch('/direcciones/:id/desactivar', authorization, desactivarDireccionController);
// // - Provincias
// router.post('/provincias', authorization, crearProvinciaController);
// router.get('/provincias', authorization, obtenerProvincias);
// router.get('/provincias/:id', authorization, obtenerProvincia);
// router.patch('/provincias/:id', authorization, actualizarProvinciaController);
// router.delete('/provincias/:id', authorization, eliminarProvinciaController);
// // - Cantones
// router.post('/cantones', authorization, crearCantonController);
// router.get('/cantones', authorization, obtenerCantonesPorProvincia);
// router.get('/cantones/:id', authorization, obtenerCanton);
// router.get('/provincias/:id_provincia/cantones', authorization, obtenerCantonesPorProvincia);
// router.patch('/cantones/:id', authorization, actualizarCantonController);
// router.delete('/cantones/:id', authorization, eliminarCantonController);
// // - Distritos
// router.post('/distritos', authorization, crearDistritoController);
// router.get('/distritos', authorization, obtenerDistritosController);
// router.get('/distritos/:id', authorization, obtenerDistrito);
// router.get('/cantones/:id_canton/distritos', authorization, obtenerDistritosPorCanton);
// router.patch('/distritos/:id', authorization, actualizarDistritoController);
// router.delete('/distritos/:id', authorization, eliminarDistritoController);

// // Vínculo Laboral
// // - Departamentos
// router.post('/departamentos', authorization, crearDepartamento);
// router.get('/departamentos', authorization, obtenerTodosDepartamentos);
// router.get('/departamentos/:id', authorization, obtenerDepartamento);
// router.patch('/departamentos/:id', authorization, patchDepartamento);
// router.delete('/departamentos/:id', authorization, borrarDepartamento);
// // - Puestos
// router.post('/puestos', authorization, crearPuesto);
// router.get('/puestos', authorization, obtenerTodosPuestos);
// router.get('/puestos/:id', authorization, obtenerPuesto);
// router.patch('/puestos/:id', authorization, patchPuesto);
// router.patch('/puestos/:id', authorization, borrarPuesto);
// // - Contratos
// router.post('/contratos', authorization, crearContrato);
// router.patch('/contratos/:id', authorization, editarContrato);
// router.get('/contratos/colaborador/:id', authorization, obtenerContratosDeColaborador);
// // Tipo Contrato
// router.post('/tipos_contrato', authorization, crearTipoContrato);
// router.get('/tipos_contrato', authorization, obtenerTodosTiposContrato);
// router.get('/tipos_contrato/:id', authorization, obtenerTipoContrato);
// router.patch('/tipos_contrato/:id', authorization, patchTipoContrato);
// router.delete('/tipos_contrato/:id', authorization, borrarTipoContrato);
// // - Jornada
// router.post('/tipos_jornada', authorization, crearTipoJornada);
// router.get('/tipos_jornada', authorization, obtenerTodosTiposJornada);
// router.get('/tipos_jornada/:id', authorization, obtenerTipoJornada);
// router.patch('/tipos_jornada/:id', authorization, patchTipoJornada);
// router.delete('/tipos_jornada/:id', authorization, borrarTipoJornada);
// // - Horarios
// router.post('/horarios', authorization, crearHorario);
// router.get('/horarios', authorization, obtenerTodosHorarios);
// router.patch('/horarios/:id', authorization, modificarHorario);

export default router;