import { HTTP_CODES } from "../../common/strings.js";
import { actualizarEstado } from "./handlers/actualizarEstado.js";
import { crearNuevoEstado } from "./handlers/crearNuevoEstado.js";
import { eliminarEstado } from "./handlers/eliminarEstado.js";
import { obtenerEstadoPorId } from "./handlers/obtenerEstado.js";
import { obtenerEstados } from "./handlers/obtenerEstados.js";

export const crearEstado = async (req, res, next) => {
  try {
    const data = await crearNuevoEstado({ estado: req.body.estado });
    res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true, status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Estado creado correctamente", data,
    });
  } catch (e) { next(e); }
};

export const obtenerTodosEstados = async (_req, res, next) => {
  try {
    const data = await obtenerEstados();
    res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true, status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa", data,
    });
  } catch (e) { next(e); }
};

export const obtenerEstado = async (req, res, next) => {
  try {
    const data = await obtenerEstadoPorId({ id: req.params.id });
    res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true, status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa", data,
    });
  } catch (e) { next(e); }
};

export const patchEstado = async (req, res, next) => {
  try {
    const data = await actualizarEstado({ id: req.params.id, patch: req.body });
    res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true, status_code: HTTP_CODES.SUCCESS.OK,
      message: "Estado actualizado", data,
    });
  } catch (e) { next(e); }
};

export const borrarEstado = async (req, res, next) => {
  try {
    const data = await eliminarEstado({ id: req.params.id });
    res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true, status_code: HTTP_CODES.SUCCESS.OK,
      message: "Estado eliminado", data,
    });
  } catch (e) { next(e); }
};
