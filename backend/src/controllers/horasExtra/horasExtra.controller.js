import { HTTP_CODES } from "../../common/strings.js";
import { modificarSolicitudHoraExtra } from "./handlers/solicitudes/actualizarSolicitud.js";
import { crearSolicitudHoraExtra } from "./handlers/solicitudes/crearSolicitud.js";
import { obtenerSolicitudesHoraExtra } from "./handlers/solicitudes/obtenerSolicitudes.js";
import { actualizarTipoHoraExtra } from "./handlers/tiposHoraExtra/actualizarTipo.js";
import { crearTipoHoraExtra } from "./handlers/tiposHoraExtra/crearNuevoTipo.js";
import { eliminarTipoHoraExtra } from "./handlers/tiposHoraExtra/eliminarTipo.js";
import { obtenerTipoHoraExtraPorId } from "./handlers/tiposHoraExtra/obtenerTipo.js";
import { obtenerTiposHoraExtra } from "./handlers/tiposHoraExtra/obtenerTipos.js";

const toNumberId = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error("ID inválido");
  return n;
};

const sanitizeText = (value, maxLen, fieldName) => {
  const v = String(value ?? "").trim();
  if (!v) throw new Error(`${fieldName} es obligatorio`);
  if (v.length > maxLen) throw new Error(`${fieldName} no puede exceder ${maxLen} caracteres`);
  return v;
};

const sanitizeDecimal = (value, fieldName) => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`${fieldName} debe ser numérico`);
  if (n <= 0) throw new Error(`${fieldName} debe ser mayor que 0`);
  return n;
};

export const crearTipoHoraExtraController = async (req, res, next) => {
  try {
    const nombre = sanitizeText(req.body?.nombre, 30, "nombre");
    const descripcion = sanitizeText(req.body?.descripcion, 120, "descripcion");
    const multiplicador = sanitizeDecimal(req.body?.multiplicador, "multiplicador");

    const data = await crearTipoHoraExtra({ nombre, descripcion, multiplicador });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Tipo de hora extra creado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTiposHoraExtraController = async (_req, res, next) => {
  try {
    const data = await obtenerTiposHoraExtra();

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTipoHoraExtraPorIdController = async (req, res, next) => {
  try {
    const id_tipo_hx = toNumberId(req.params?.id);
    const data = await obtenerTipoHoraExtraPorId({ id_tipo_hx });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarTipoHoraExtraController = async (req, res, next) => {
  try {
    const id_tipo_hx = toNumberId(req.params?.id);

    const payload = {};
    if (req.body?.nombre !== undefined) payload.nombre = sanitizeText(req.body?.nombre, 30, "nombre");
    if (req.body?.descripcion !== undefined) payload.descripcion = sanitizeText(req.body?.descripcion, 120, "descripcion");
    if (req.body?.multiplicador !== undefined) payload.multiplicador = sanitizeDecimal(req.body?.multiplicador, "multiplicador");

    if (Object.keys(payload).length === 0) {
      throw new Error("Debe enviar al menos un campo para actualizar");
    }

    const data = await actualizarTipoHoraExtra({ id_tipo_hx, ...payload });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Tipo de hora extra actualizado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarTipoHoraExtraController = async (req, res, next) => {
  try {
    const id_tipo_hx = toNumberId(req.params?.id);

    const data = await eliminarTipoHoraExtra({ id_tipo_hx });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Tipo de hora extra eliminado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};


// Solicitudes
export const crearSolicitudesHorasExtra = async (req, res, next) => {
  try {
    const { id_colaborador, fecha_trabajo, horas_solicitadas, id_tipo_hx, justificacion } = req.body;

    const data = await crearSolicitudHoraExtra({
      id_colaborador,
      fecha_trabajo,
      horas_solicitadas,
      id_tipo_hx,
      justificacion,
    });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Solicitud de horas extra creada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerAgrupamientoSolicitudesHorasExtra = async (req, res, next) => {
  try {
    const { agrupamiento, estado, id_colaborador } = req.query;

    const data = await obtenerSolicitudesHoraExtra({
      agrupamiento,
      estado,  
      id_colaborador,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const patchSolicitudHorasExtra = async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      id_aprobador,
      fecha_trabajo,
      horas_solicitadas,
      id_tipo_hx,
      justificacion,
      estado,
      horas_aprobadas,
    } = req.body;

    const data = await modificarSolicitudHoraExtra({
      id_solicitud_hx: id,
      id_aprobador,
      fecha_trabajo,
      horas_solicitadas,
      id_tipo_hx,
      justificacion,
      estado,
      horas_aprobadas,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Solicitud actualizada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};
