// import { HTTP_CODES } from "../../common/strings.js";
// import { crearSolicitudPermisoLicencia } from "./handler/solicitud/crearSolicitudPermiso.js";
// import { cambiarEstadoPermisoLicencia } from "./handler/solicitud/modificarSolicitudPermiso.js";
// import { obtenerPermisosLicenciasPorColaborador } from "./handler/solicitud/obtenerPermisosPorColaborador.js";
// import { obtenerPermisosLicenciasPorRango } from "./handler/solicitud/obtenerPermisosPorRango.js";
// import { crearTipoSolicitud } from "./handler/tipoSolicitud/crearTipoSolicitud.js";
// import { eliminarTipoSolicitud } from "./handler/tipoSolicitud/eliminarTipoSolicitud.js";
// import { modificarTipoSolicitud } from "./handler/tipoSolicitud/modificarTipoSolicitud.js";
// import { obtenerTipoSolicitud } from "./handler/tipoSolicitud/obtenerTipoSolicitud.js";
// import { obtenerTodosTiposSolicitud } from "./handler/tipoSolicitud/obtenerTodosTiposSolicitud.js";

// export const postPermisoLicencia = async (req, res, next) => {
//   try {
//     const data = await crearSolicitudPermisoLicencia({ ...req.body });

//     return res.status(HTTP_CODES.SUCCESS.CREATED).json({
//       success: true,
//       status_code: HTTP_CODES.SUCCESS.CREATED,
//       message: "Solicitud de permiso/licencia registrada correctamente",
//       data,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const patchPermisoLicenciaEstado = async (req, res, next) => {
//   try {
//     const id_solicitud = Number(req.params.id);

//     const data = await cambiarEstadoPermisoLicencia({
//       id_solicitud,
//       nuevo_estado: req.body?.nuevo_estado,
//       observaciones: req.body?.observaciones,
//       id_aprobador: req.body?.id_aprobador,
//     });

//     return res.status(HTTP_CODES.SUCCESS.OK).json({
//       success: true,
//       status_code: HTTP_CODES.SUCCESS.OK,
//       message: "Estado de solicitud actualizado correctamente",
//       data,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getPermisosLicenciasPorColaborador = async (req, res, next) => {
//   try {
//     const id_colaborador = Number(req.params.id_colaborador);

//     const data = await obtenerPermisosLicenciasPorColaborador({
//       id_colaborador,
//       desde: req.query.from ?? null,
//       hasta: req.query.to ?? null,
//       estado: req.query.estado ?? null,
//     });

//     return res.status(HTTP_CODES.SUCCESS.OK).json({
//       success: true,
//       status_code: HTTP_CODES.SUCCESS.OK,
//       message: "Consulta exitosa",
//       data,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export const getPermisosLicenciasPorRango = async (req, res, next) => {
//   try {
//     const { desde, hasta, id_colaborador } = req.query;

//     const data = await obtenerPermisosLicenciasPorRango({
//       desde,
//       hasta,
//       id_colaborador: id_colaborador ? Number(id_colaborador) : null,
//       estado: req.query.estado ?? null,
//     });

//     return res.status(HTTP_CODES.SUCCESS.OK).json({
//       success: true,
//       status_code: HTTP_CODES.SUCCESS.OK,
//       message: "Consulta exitosa",
//       data,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // Tipos

// export const crearTipo = async (req, res, next) => {
//   try {
//     const { tipo_solicitud, es_licencia, es_permiso } = req.body;

//     const data = await crearTipoSolicitud({ 
//       tipo_solicitud, 
//       es_licencia, 
//       es_permiso 
//     });

//     res.status(HTTP_CODES.SUCCESS.CREATED).json({
//       success: true,
//       status_code: HTTP_CODES.SUCCESS.CREATED,
//       message: "Tipo de solicitud creado exitosamente",
//       data,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const modificarTipo = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const { tipo_solicitud, es_licencia, es_permiso } = req.body;

//     const data = await modificarTipoSolicitud({
//       id_tipo_solicitud: id,
//       tipo_solicitud,
//       es_licencia,
//       es_permiso,
//     });

//     res.status(HTTP_CODES.SUCCESS.OK).json({
//       success: true,
//       status_code: HTTP_CODES.SUCCESS.OK,
//       message: "Tipo de solicitud actualizado exitosamente",
//       data,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const obtenerTodos = async (_req, res, next) => {
//   try {
//     const data = await obtenerTodosTiposSolicitud();

//     res.status(HTTP_CODES.SUCCESS.OK).json({
//       success: true,
//       status_code: HTTP_CODES.SUCCESS.OK,
//       message: "Tipos de solicitud obtenidos exitosamente",
//       data,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const obtenerPorId = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const data = await obtenerTipoSolicitud({ id_tipo_solicitud: id });

//     res.status(HTTP_CODES.SUCCESS.OK).json({
//       success: true,
//       status_code: HTTP_CODES.SUCCESS.OK,
//       message: "Tipo de solicitud obtenido exitosamente",
//       data,
//     });
//   } catch (error) {
//     next(error);
//   }
// };

// export const eliminarTipo = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const data = await eliminarTipoSolicitud({ id_tipo_solicitud: id });

//     res.status(HTTP_CODES.SUCCESS.OK).json({
//       success: true,
//       status_code: HTTP_CODES.SUCCESS.OK,
//       message: "Tipo de solicitud eliminado exitosamente",
//       data,
//     });
//   } catch (error) {
//     next(error);
//   }
// };