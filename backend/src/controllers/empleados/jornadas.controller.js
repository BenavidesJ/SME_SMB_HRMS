
import { HTTP_CODES } from "../../common/strings.js";
import { crearHorarioLaboral } from "./handlers/vinculoLaboral/jornadas/horarios/crearHorarioLaboral.js";
import { modificarHorarioLaboral } from "./handlers/vinculoLaboral/jornadas/horarios/modificarHorarioLaboral.js";
import { obtenerHorariosLaborales } from "./handlers/vinculoLaboral/jornadas/horarios/obtenerHorarios.js";
import { actualizarTipoJornada } from "./handlers/vinculoLaboral/jornadas/tipo_jornada/actualizarTipoJornada.js";
import { crearNuevoTipoJornada } from "./handlers/vinculoLaboral/jornadas/tipo_jornada/crearTipoJornada.js";
import { eliminarTipoJornada } from "./handlers/vinculoLaboral/jornadas/tipo_jornada/eliminarTipoJornada.js";
import { obtenerTipoJornadaPorId } from "./handlers/vinculoLaboral/jornadas/tipo_jornada/obtenerTipoJornada.js";
import { obtenerTiposJornada } from "./handlers/vinculoLaboral/jornadas/tipo_jornada/obtenerTiposJornada.js";

// Horarios

export const crearHorario = async (req, res, next) => {
  try {
    const {
      id_contrato,
      hora_inicio,
      hora_fin,
      minutos_descanso,
      dias_laborales,
      dias_libres,
      estado,
      fecha_actualizacion,
      tipo_jornada,
    } = req.body;

    const requiredFields = {
      id_contrato,
      hora_inicio,
      hora_fin,
      estado,
      tipo_jornada,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || String(value).trim() === "") {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    const contratoId = Number(id_contrato);
    if (!Number.isInteger(contratoId) || contratoId <= 0) {
      throw new Error("id_contrato debe ser un número entero válido");
    }

    const result = await crearHorarioLaboral({
      id_contrato: contratoId,
      hora_inicio,
      hora_fin,
      minutos_descanso,
      dias_laborales,
      dias_libres,
      estado,
      fecha_actualizacion,
      tipo_jornada,
    });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Horario laboral creado correctamente",
      data: result,
      warnings: result.warnings ?? [],
    });
  } catch (error) {
    next(error);
  }
};

export const modificarHorario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const data = await modificarHorarioLaboral({
      id_horario: id,
      patch: req.body,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Horario actualizado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosHorarios = async (_req, res, next) => {
  try {
    const data = await obtenerHorariosLaborales();

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

// Tipos Jornada

export const crearTipoJornada = async (req, res, next) => {
  try {
    const { tipo, max_horas_diarias, max_horas_semanales } = req.body;

    const requiredFields = {
      tipo,
      max_horas_diarias,
      max_horas_semanales,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || String(value).trim() === "") {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    const maxDia = Number(String(max_horas_diarias).trim().replace(",", "."));
    const maxSemana = Number(String(max_horas_semanales).trim().replace(",", "."));

    if (!Number.isFinite(maxDia) || !Number.isFinite(maxSemana)) {
      throw new Error("Las horas máximas deben ser valores numéricos");
    }

    if (maxDia <= 0 || maxSemana <= 0) {
      throw new Error("Las horas máximas deben ser mayores a 0");
    }

    if (maxDia > 12) {
      throw new Error("El máximo de horas diarias excede el máximo permitido por el Código de Trabajo para cualquier jornada (12)");
    }
    if (maxSemana > 72) {
      throw new Error("l máximo de horas semanales excede el máximo permitido por el Código de Trabajo para cualquier jornada (72)");
    }

    const {
      id,
      tipo_jornada,
      cantidad_max_horas_dia,
      cantidad_max_horas_semana,
    } = await crearNuevoTipoJornada({
      tipo,
      max_horas_diarias,
      max_horas_semanales,
    });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Tipo de jornada creado correctamente",
      data: {
        id,
        tipo_jornada,
        cantidad_max_horas_dia,
        cantidad_max_horas_semana,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosTiposJornada = async (_req, res, next) => {
  try {
    const data = await obtenerTiposJornada();

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

export const obtenerTipoJornada = async (req, res, next) => {
  try {
    const data = await obtenerTipoJornadaPorId({ id: req.params.id });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const patchTipoJornada = async (req, res, next) => {
  try {
    const { tipo, max_horas_diarias, max_horas_semanales } = req.body ?? {};

    if (!req.body || Object.keys(req.body).length === 0) {
      throw new Error("Debe enviar al menos un campo para actualizar");
    }

    const fieldsThatCame = {
      ...(tipo !== undefined ? { tipo } : {}),
      ...(max_horas_diarias !== undefined ? { max_horas_diarias } : {}),
      ...(max_horas_semanales !== undefined ? { max_horas_semanales } : {}),
    };

    for (const [field, value] of Object.entries(fieldsThatCame)) {
      if (value === undefined || value === null || String(value).trim() === "") {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    const parseHourValue = (v) => Number(String(v).trim().replace(",", "."));

    const maxDia =
      max_horas_diarias !== undefined ? parseHourValue(max_horas_diarias) : undefined;

    const maxSemana =
      max_horas_semanales !== undefined ? parseHourValue(max_horas_semanales) : undefined;

    if (
      (maxDia !== undefined && !Number.isFinite(maxDia)) ||
      (maxSemana !== undefined && !Number.isFinite(maxSemana))
    ) {
      throw new Error("Las horas máximas deben ser valores numéricos");
    }

    if (
      (maxDia !== undefined && maxDia <= 0) ||
      (maxSemana !== undefined && maxSemana <= 0)
    ) {
      throw new Error("Las horas máximas deben ser mayores a 0");
    }

    if (maxDia !== undefined && maxDia > 12) {
      throw new Error(
        "El máximo de horas diarias excede el máximo permitido por el Código de Trabajo para cualquier jornada (12)",
      );
    }

    if (maxSemana !== undefined && maxSemana > 72) {
      throw new Error(
        "El máximo de horas semanales excede el máximo permitido por el Código de Trabajo para cualquier jornada (72)",
      );
    }

    if (maxDia !== undefined && maxSemana !== undefined && maxSemana < maxDia) {
      throw new Error(
        "max_horas_semanales no puede ser menor que max_horas_diarias",
      );
    }

    const data = await actualizarTipoJornada({
      id: req.params.id,
      patch: {
        ...(tipo !== undefined ? { tipo } : {}),
        ...(max_horas_diarias !== undefined ? { max_horas_diarias: maxDia } : {}),
        ...(max_horas_semanales !== undefined ? { max_horas_semanales: maxSemana } : {}),
      },
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Tipo de jornada actualizado",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const borrarTipoJornada = async (req, res, next) => {
  try {
    const data = await eliminarTipoJornada({ id: req.params.id });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Tipo de jornada eliminado",
      data,
    });
  } catch (e) {
    next(e);
  }
};