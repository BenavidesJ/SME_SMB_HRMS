import { HTTP_CODES } from "../../common/strings.js";
import { crearNuevoCicloPago } from "./handlers/pagos/crearCicloPagos.js";
import { obtenerCiclosPago } from "./handlers/pagos/obtenerCiclosPago.js";
import { generarDetallePlanilla } from "./handlers/planilla/generarDetallePlanilla.js";
import { crearPeriodo } from "./handlers/periodos/crearPeriodo.js";
import { obtenerPeriodos } from "./handlers/periodos/obtenerPeriodos.js";
import { obtenerPeriodoPorId } from "./handlers/periodos/obtenerPeriodo.js";
import { actualizarPeriodo } from "./handlers/periodos/actualizarPeriodo.js";
import { desactivarPeriodo } from "./handlers/periodos/desactivarPeriodo.js";

import {
  sequelize,
  Estado,
  PeriodoPlanilla,
  DetallePlanilla,
  TipoJornada,
  JornadaDiaria,
  SolicitudPermisosLicencias,
  SolicitudHoraExtra,
  Contrato,
  HorarioLaboral,
  Feriado,
  Incapacidad,
  SolicitudVacaciones,
} from "../../models/index.js";
import { obtenerDetallesPlanilla } from "./handlers/planilla/obtenerDetallesPlanillaPorColaboradores.js";

const models = {
  sequelize,
  Estado,
  PeriodoPlanilla,
  DetallePlanilla,
  TipoJornada,
  JornadaDiaria,
  HorarioLaboral,
  SolicitudPermisosLicencias,
  SolicitudHoraExtra,
  Contrato,
  Feriado,
  Incapacidad,
  SolicitudVacaciones
};

export const crearCicloPago = async (req, res, next) => {
  const { ciclo } = req.body;
  try {

    if (!ciclo) throw new Error("El nombre del ciclo es obligatorio");

    const { id, ciclo: cicloPago } = await crearNuevoCicloPago({ nombre: ciclo });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Ciclo de pago creado correctamente",
      data: {
        id: id,
        ciclo_pago: cicloPago
      }
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosCiclos = async (_req, res, next) => {
  try {
    const data = await obtenerCiclosPago();

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

export const generarDetallePlanillaController = async (req, res, next) => {
  try {
    const { id_periodo, colaboradores, fecha_inicio, fecha_fin, generado_por, id_ciclo_pago } = req.body;

    const payload = {
      id_periodo_planilla: id_periodo,
      id_colaboradores: colaboradores,
      fecha_inicio,
      fecha_fin,
      generado_por,
      id_ciclo_pago: id_ciclo_pago ?? 1,
    };

    const config = {
      tz: "America/Costa_Rica",
      leaveBlockingStatusIds: [],
      overtimeApprovedEstadoIds: [], 
    };

    const data = await generarDetallePlanilla({
      models,
      payload,
      config, 
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Planilla generada exitosamente",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const obtenerDetallesPlanillaController = async (req, res, next) => {
  try {
    const { id_periodo, colaboradores } = req.body;

    const payload = {
      id_periodo_planilla: id_periodo,
      id_colaboradores: colaboradores,
    };

    const data = await obtenerDetallesPlanilla({
      models,
      payload,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Detalle de planilla consultado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// Periodos de Planilla

const toNumberId = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error("ID inválido");
  return n;
};

const sanitizeDate = (value, fieldName) => {
  const v = String(value ?? "").trim();
  if (!v) throw new Error(`${fieldName} es obligatorio`);
  const date = new Date(v);
  if (isNaN(date.getTime())) throw new Error(`${fieldName} debe ser una fecha válida (YYYY-MM-DD)`);
  return v;
};

const sanitizeText = (value, fieldName, maxLen = 255) => {
  const v = String(value ?? "").trim();
  if (!v) throw new Error(`${fieldName} es obligatorio`);
  if (v.length > maxLen) throw new Error(`${fieldName} no puede exceder ${maxLen} caracteres`);
  return v;
};

export const crearPeriodoController = async (req, res, next) => {
  try {
    const fecha_inicio = sanitizeDate(req.body?.fecha_inicio, "fecha_inicio");
    const fecha_fin = sanitizeDate(req.body?.fecha_fin, "fecha_fin");
    const fecha_pago = sanitizeDate(req.body?.fecha_pago, "fecha_pago");
    const id_ciclo_pago = toNumberId(req.body?.id_ciclo_pago);
    const descripcion = req.body?.descripcion ? sanitizeText(req.body?.descripcion, "descripcion", 255) : undefined;

    const data = await crearPeriodo({
      fecha_inicio,
      fecha_fin,
      fecha_pago,
      id_ciclo_pago,
      descripcion,
    });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Periodo de planilla creado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerPeriodosController = async (_req, res, next) => {
  try {
    const data = await obtenerPeriodos();

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

export const obtenerPeriodoController = async (req, res, next) => {
  try {
    const id_periodo = toNumberId(req.params?.id);
    const data = await obtenerPeriodoPorId({ id_periodo });

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

export const actualizarPeriodoController = async (req, res, next) => {
  try {
    const id_periodo = toNumberId(req.params?.id);

    const payload = { id_periodo };

    if (req.body?.fecha_inicio !== undefined) {
      payload.fecha_inicio = sanitizeDate(req.body?.fecha_inicio, "fecha_inicio");
    }
    if (req.body?.fecha_fin !== undefined) {
      payload.fecha_fin = sanitizeDate(req.body?.fecha_fin, "fecha_fin");
    }
    if (req.body?.fecha_pago !== undefined) {
      payload.fecha_pago = sanitizeDate(req.body?.fecha_pago, "fecha_pago");
    }
    if (req.body?.id_ciclo_pago !== undefined) {
      payload.id_ciclo_pago = toNumberId(req.body?.id_ciclo_pago);
    }
    if (req.body?.descripcion !== undefined) {
      payload.descripcion = sanitizeText(req.body?.descripcion, "descripcion", 255);
    }

    const data = await actualizarPeriodo(payload);

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Periodo de planilla actualizado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const desactivarPeriodoController = async (req, res, next) => {
  try {
    const id_periodo = toNumberId(req.params?.id);

    const data = await desactivarPeriodo({ id_periodo });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Periodo de planilla desactivado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};