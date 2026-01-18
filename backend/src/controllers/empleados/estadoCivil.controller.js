import { HTTP_CODES } from "../../common/strings.js";
import { actualizarEstadoCivil } from "./handlers/estadoCivil/actualizarEstadoCivil.js";
import { crearNuevoEstadoCivil } from "./handlers/estadoCivil/crearNuevoEstadoCivil.js";
import { eliminarEstadoCivil } from "./handlers/estadoCivil/eliminarEstadoCivil.js";
import { obtenerEstadoCivilPorId } from "./handlers/estadoCivil/obtenerEstadoCivilPorId.js";
import { obtenerEstadosCiviles } from "./handlers/estadoCivil/obtenerEstadosCiviles.js";

export const crearEstadoCivil = async (req, res, next) => {
  const { estado_civil } = req.body;
  try {

    if (!estado_civil) throw new Error("El estado civil es obligatorio");

    const { id, estado_civil: marStat } = await crearNuevoEstadoCivil({ estado_civil });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Estado Civil creado correctamente",
      data: {
        id: id,
        estado_civil: marStat
      }
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosEstadosCiviles = async (_req, res, next) => {
  try {
    const data = await obtenerEstadosCiviles();

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerEstadoCivil = async (req, res, next) => {
  try {
    const data = await obtenerEstadoCivilPorId({ id: req.params.id });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (e) { next(e); }
};

export const patchEstadoCivil = async (req, res, next) => {
  try {
    const data = await actualizarEstadoCivil({
      id: req.params.id,
      patch: req.body,
    });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Estado civil actualizado",
      data,
    });
  } catch (e) { next(e); }
};

export const borrarEstadoCivil = async (req, res, next) => {
  try {
    const data = await eliminarEstadoCivil({ id: req.params.id });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Estado civil eliminado",
      data,
    });
  } catch (e) { next(e); }
};