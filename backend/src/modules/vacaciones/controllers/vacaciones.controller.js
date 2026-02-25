import { HTTP_CODES } from "../../../common/strings.js";
import { listarVacacionesPorColaborador } from "../handlers/listarVacacionesPorColaborador.js";
import { solicitarVacaciones } from "../handlers/solicitarVacaciones.js";
import { actualizarEstadoSolicitudVacaciones } from "../handlers/actualizarEstadoSolicitudVacaciones.js";
import { Usuario } from "../../../models/index.js";

const CREATED = HTTP_CODES.SUCCESS.CREATED;
const OK = HTTP_CODES.SUCCESS.OK;

async function resolveActorFromToken(tokenId) {
  const numericId = Number(tokenId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error("No se pudo identificar al usuario autenticado");
  }

  let usuario = await Usuario.findByPk(numericId, {
    attributes: ["id_usuario", "id_colaborador"],
  });

  // Compatibilidad: token puede traer id_colaborador en vez de id_usuario
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

export async function solicitarVacacionesController(req, res, next) {
  try {
    const actor = await resolveActorFromToken(req.user?.id);
    const requestedColaboradorId = Number(req.body?.id_colaborador);

    if (!Number.isInteger(requestedColaboradorId) || requestedColaboradorId <= 0) {
      throw new Error("id_colaborador debe ser un entero positivo");
    }

    if (requestedColaboradorId !== actor.id_colaborador) {
      throw new Error("No puedes crear solicitudes para otro colaborador");
    }

    const data = await solicitarVacaciones({
      ...(req.body ?? {}),
      id_colaborador: actor.id_colaborador,
    });

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
    const actor = await resolveActorFromToken(req.user?.id);

    const targetColaboradorId = Number(idColaborador);
    if (!Number.isInteger(targetColaboradorId) || targetColaboradorId <= 0) {
      throw new Error("id_colaborador debe ser un entero positivo");
    }

    const data = await listarVacacionesPorColaborador({
      id_colaborador: targetColaboradorId,
      aprobador_filter:
        actor.id_colaborador !== targetColaboradorId ? actor.id_colaborador : null,
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
    const actor = await resolveActorFromToken(req.user?.id);

    const data = await actualizarEstadoSolicitudVacaciones({
      id_solicitud_vacaciones: idSolicitud,
      nuevo_estado,
      id_usuario_actor: actor.id_usuario,
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
