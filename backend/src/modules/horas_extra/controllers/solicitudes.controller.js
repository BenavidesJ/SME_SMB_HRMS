import { HTTP_CODES } from "../../../common/strings.js";
import { crearSolicitudHoraExtra } from "../handlers/solicitudes/crearSolicitudHoraExtra.js";
import { actualizarSolicitudHoraExtra } from "../handlers/solicitudes/actualizarSolicitudHoraExtra.js";
import { obtenerSolicitudesHoraExtra } from "../handlers/solicitudes/obtenerSolicitudesHoraExtra.js";

/**
 * Controller para crear una solicitud de horas extra
 */
export const crearSolicitudHorasExtra = async (req, res, next) => {
  try {
    const { id_colaborador, fecha_trabajo, horas_solicitadas, id_tipo_hx, justificacion } = req.body ?? {};

    if (id_colaborador === undefined || id_colaborador === null) {
      throw new Error("id_colaborador es obligatorio");
    }

    if (!fecha_trabajo || String(fecha_trabajo).trim() === "") {
      throw new Error("fecha_trabajo es obligatoria");
    }

    if (horas_solicitadas === undefined || horas_solicitadas === null) {
      throw new Error("horas_solicitadas es obligatorio");
    }

    if (id_tipo_hx === undefined || id_tipo_hx === null) {
      throw new Error("id_tipo_hx es obligatorio");
    }

    if (!justificacion || String(justificacion).trim() === "") {
      throw new Error("justificacion es obligatoria");
    }

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

/**
 * Controller para actualizar una solicitud de horas extra
 */
export const actualizarSolicitudHorasExtra = async (req, res, next) => {
  try {
    const { id } = req.params ?? {};
    const {
      fecha_trabajo,
      horas_solicitadas,
      id_tipo_hx,
      justificacion,
      estado,
    } = req.body ?? {};

    const idFromParams = id ?? null;
    const idFromBody = req.body?.id_solicitud_hx ?? null;

    const idSolicitud =
      idFromParams !== null && idFromParams !== undefined && String(idFromParams).trim() !== ""
        ? idFromParams
        : idFromBody;

    if (idSolicitud === undefined || idSolicitud === null || String(idSolicitud).trim() === "") {
      throw new Error("El identificador de la solicitud es obligatorio");
    }

    const data = await actualizarSolicitudHoraExtra({
      id_solicitud_hx: idSolicitud,
      fecha_trabajo,
      horas_solicitadas,
      id_tipo_hx,
      justificacion,
      estado,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Solicitud de horas extra actualizada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para obtener solicitudes de horas extra
 */
export const obtenerSolicitudesHorasExtra = async (req, res, next) => {
  try {
    const { agrupamiento, estado, id_colaborador } = req.query ?? {};

    const data = await obtenerSolicitudesHoraExtra({ agrupamiento, estado, id_colaborador });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Solicitudes de horas extra obtenidas correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};
