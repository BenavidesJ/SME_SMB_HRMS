import { HTTP_CODES } from "../../../common/strings.js";
import { crearSolicitudHoraExtra } from "../handlers/solicitudes/crearSolicitudHoraExtra.js";
import { actualizarSolicitudHoraExtra } from "../handlers/solicitudes/actualizarSolicitudHoraExtra.js";
import { obtenerSolicitudesHoraExtra } from "../handlers/solicitudes/obtenerSolicitudesHoraExtra.js";
import { Usuario } from "../../../models/index.js";

async function resolveActorFromToken(tokenId) {
  const numericId = Number(tokenId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error("No se pudo identificar al usuario autenticado");
  }

  let usuario = await Usuario.findByPk(numericId, {
    attributes: ["id_usuario", "id_colaborador"],
  });

  if (!usuario) {
    usuario = await Usuario.findOne({
      where: { id_colaborador: numericId },
      attributes: ["id_usuario", "id_colaborador"],
    });
  }

  if (!usuario) {
    throw new Error("El usuario autenticado no existe");
  }

  return {
    id_usuario: Number(usuario.id_usuario),
    id_colaborador: Number(usuario.id_colaborador),
  };
}

/**
 * Controller para crear una solicitud de horas extra
 */
export const crearSolicitudHorasExtra = async (req, res, next) => {
  try {
    const actor = await resolveActorFromToken(req.user?.id);
    const { id_colaborador, fecha_trabajo, horas_solicitadas, id_tipo_hx } = req.body ?? {};

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

    const requestedColaboradorId = Number(id_colaborador);
    if (!Number.isInteger(requestedColaboradorId) || requestedColaboradorId <= 0) {
      throw new Error("id_colaborador debe ser un entero positivo");
    }

    if (requestedColaboradorId !== actor.id_colaborador) {
      throw new Error("No puedes crear solicitudes para otro colaborador");
    }

    const data = await crearSolicitudHoraExtra({
      id_colaborador: actor.id_colaborador,
      fecha_trabajo,
      horas_solicitadas,
      id_tipo_hx,
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
      estado,
    } = req.body ?? {};
    const actor = await resolveActorFromToken(req.user?.id);

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
      estado,
      id_usuario_actor: actor.id_usuario,
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
    const actor = await resolveActorFromToken(req.user?.id);

    const targetColaboradorId =
      id_colaborador !== undefined && id_colaborador !== null && String(id_colaborador).trim() !== ""
        ? Number(id_colaborador)
        : null;

    if (targetColaboradorId !== null && (!Number.isInteger(targetColaboradorId) || targetColaboradorId <= 0)) {
      throw new Error("id_colaborador debe ser un entero positivo");
    }

    const data = await obtenerSolicitudesHoraExtra({
      agrupamiento,
      estado,
      id_colaborador: targetColaboradorId,
      id_aprobador:
        targetColaboradorId !== null && targetColaboradorId !== actor.id_colaborador
          ? actor.id_colaborador
          : undefined,
    });

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
