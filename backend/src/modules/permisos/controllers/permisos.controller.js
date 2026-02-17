import { HTTP_CODES } from "../../../common/strings.js";
import { solicitarPermiso } from "../handlers/solicitarPermiso.js";
import { actualizarEstadoSolicitudPermiso } from "../handlers/actualizarEstadoSolicitudPermiso.js";
import { listarPermisosPorColaborador } from "../handlers/listarPermisosPorColaborador.js";
import { Usuario } from "../../../models/index.js";

const CREATED = HTTP_CODES.SUCCESS.CREATED;

export async function solicitarPermisoController(req, res, next) {
  try {
    const data = await solicitarPermiso(req.body ?? {});

    return res.status(CREATED).json({
      success: true,
      status_code: CREATED,
      message: "Solicitud de permiso registrada",
      data,
    });
  } catch (error) {
    next(error);
  }
}

const OK = HTTP_CODES.SUCCESS.OK;

export async function actualizarEstadoSolicitudPermisoController(req, res, next) {
  try {
    const idSolicitud = req.params?.id;
    const { nuevo_estado } = req.body ?? {};
    const usuarioId = req.user?.id;

    if (!usuarioId) {
      throw new Error("No se pudo identificar al usuario autenticado");
    }

    const data = await actualizarEstadoSolicitudPermiso({
      id_solicitud_permiso: idSolicitud,
      nuevo_estado,
      id_usuario_actor: usuarioId,
    });

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Estado de permiso actualizado",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listarPermisosPorColaboradorController(req, res, next) {
  try {
    const idColaborador = req.params?.id_colaborador ?? req.params?.id;
    const usuarioId = req.user?.id;

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

    const data = await listarPermisosPorColaborador({
      id_colaborador: targetColaboradorId,
      aprobador_filter: actorColaboradorId !== targetColaboradorId ? actorColaboradorId : null,
    });

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Solicitudes de permisos recuperadas",
      data,
    });
  } catch (error) {
    next(error);
  }
}
