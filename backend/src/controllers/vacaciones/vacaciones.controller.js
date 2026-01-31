import { HTTP_CODES } from "../../common/strings.js";

import { crearSolicitudVacaciones } from "./handlers/solicitud/crearSolicitud.js";
import { obtenerSolicitudes } from "./handlers/solicitud/obtenerSolicitudesPorColaborador.js";

import {
  getVacacionesByColaborador,
  getVacacionesByDateRange,
} from "../../services/scheduleEngine/providers/sequelizeVacationProvider.js";

import { SolicitudVacaciones } from "../../models/index.js";
import { cambiarEstadoSolicitudVacaciones } from "./handlers/solicitud/cambioEstadoSolicitud.js";

export const postVacaciones = async (req, res, next) => {
  try {
    const data = await crearSolicitudVacaciones({ ...req.body });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Solicitud de vacaciones registrada correctamente",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const patchVacacionesEstado = async (req, res, next) => {
  try {
    const id_solicitud_vacaciones = Number(req.params.id);
    const { nuevo_estado } = req.body;

    const data = await cambiarEstadoSolicitudVacaciones({
      id_solicitud_vacaciones,
      nuevo_estado,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Estado de solicitud de vacaciones actualizado correctamente",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getVacacionesPorColaborador = async (req, res, next) => {
  try {
    const id_colaborador = Number(req.params.id_colaborador);
    const limit = Number(req.query.limit ?? 50);
    const offset = Number(req.query.offset ?? 0);

    const data = await obtenerSolicitudes({
      id_colaborador,
      limit,
      offset,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getVacacionesPorRango = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const data = await getVacacionesByDateRange({
      models: { SolicitudVacaciones },
      startDate: String(startDate),
      endDate: String(endDate),
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (err) {
    next(err);
  }
};
