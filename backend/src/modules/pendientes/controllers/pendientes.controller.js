import { HTTP_CODES } from "../../../common/strings.js";
import { Usuario } from "../../../models/index.js";
import { obtenerPendientesAprobacion } from "../services/pendientes.service.js";

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

export const obtenerPendientesAprobacionController = async (req, res, next) => {
  try {
    const actor = await resolveActorFromToken(req.user?.id);
    const data = await obtenerPendientesAprobacion({
      id_aprobador: actor.id_colaborador,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Pendientes de aprobación obtenidos correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};
