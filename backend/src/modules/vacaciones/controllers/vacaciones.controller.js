import { HTTP_CODES } from "../../../common/strings.js";
import { listarVacacionesPorColaborador } from "../handlers/listarVacacionesPorColaborador.js";
import { solicitarVacaciones } from "../handlers/solicitarVacaciones.js";
import { actualizarEstadoSolicitudVacaciones } from "../handlers/actualizarEstadoSolicitudVacaciones.js";
import { Usuario } from "../../../models/index.js";

const CREATED = HTTP_CODES.SUCCESS.CREATED;
const OK = HTTP_CODES.SUCCESS.OK;

export async function solicitarVacacionesController(req, res, next) {
  try {
    const data = await solicitarVacaciones(req.body ?? {});

    return res.status(CREATED).json({
      success: true,
      status_code: CREATED,
      message: "Solicitud de vacaciones creada",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listarVacacionesPorColaboradorController(req, res, next) {
  try {
    const idColaborador = req.params?.id_colaborador ?? req.params?.id;
    const usuarioId = req.user?.id;
    const roles = Array.isArray(req.user?.roles) ? req.user.roles : [];

    if (!usuarioId) {
      throw new Error("No se pudo identificar al usuario autenticado");
    }

    const usuario = await Usuario.findByPk(usuarioId, {
      attributes: ["id_usuario", "id_colaborador"],
    });

    if (!usuario) {
      throw new Error("El usuario autenticado no existe");
    }

    const actorColaboradorId = Number(usuario.id_colaborador);
    const targetColaboradorId = Number(idColaborador);

    if (!Number.isInteger(targetColaboradorId) || targetColaboradorId <= 0) {
      throw new Error("id_colaborador debe ser un entero positivo");
    }

    const isAdmin = roles.some((role) => role === "ADMINISTRADOR" || role === "SUPER_ADMIN");

    if (actorColaboradorId !== targetColaboradorId && !isAdmin) {
      return res.status(HTTP_CODES.ERROR.CLIENT.FORBIDDEN).json({
        success: false,
        status_code: HTTP_CODES.ERROR.CLIENT.FORBIDDEN,
        message: "No tiene permisos para consultar solicitudes de otros colaboradores",
      });
    }

    const data = await listarVacacionesPorColaborador({
      id_colaborador: targetColaboradorId,
      aprobador_filter: actorColaboradorId !== targetColaboradorId ? actorColaboradorId : null,
    });

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Solicitudes de vacaciones recuperadas",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function actualizarEstadoSolicitudVacacionesController(req, res, next) {
  try {
    const idSolicitud = req.params?.id;
    const { nuevo_estado } = req.body ?? {};

    const usuarioId = req.user?.id;
    if (!usuarioId) {
      throw new Error("No se pudo identificar al usuario autenticado");
    }

    const data = await actualizarEstadoSolicitudVacaciones({
      id_solicitud_vacaciones: idSolicitud,
      nuevo_estado,
      id_usuario_actor: usuarioId,
    });

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Estado de solicitud actualizado",
      data,
    });
  } catch (error) {
    next(error);
  }
}
