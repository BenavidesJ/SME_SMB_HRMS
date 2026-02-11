import { HTTP_CODES } from "../../../common/strings.js";
import { crearRubro } from "../handlers/crearRubro.js";
import { obtenerRubros } from "../handlers/obtenerRubros.js";
import { eliminarRubro } from "../handlers/eliminarRubro.js";
import { crearEvaluacion } from "../handlers/crearEvaluacion.js";
import { obtenerEvaluaciones } from "../handlers/obtenerEvaluaciones.js";
import { obtenerEvaluacionPorId } from "../handlers/obtenerEvaluacionPorId.js";
import { finalizarEvaluacion } from "../handlers/finalizarEvaluacion.js";
import { obtenerEvaluacionesColaborador } from "../handlers/obtenerEvaluacionesColaborador.js";

const CREATED = HTTP_CODES.SUCCESS.CREATED;
const OK = HTTP_CODES.SUCCESS.OK;

// ─── Rubros ────────────────────────────────────────────────────────────────────

export async function crearRubroController(req, res, next) {
  try {
    const data = await crearRubro(req.body ?? {});
    return res.status(CREATED).json({
      success: true,
      status_code: CREATED,
      message: "Rubro de evaluación creado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function obtenerRubrosController(req, res, next) {
  try {
    const data = await obtenerRubros();
    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Rubros de evaluación obtenidos",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function eliminarRubroController(req, res, next) {
  try {
    const { id } = req.params ?? {};
    const data = await eliminarRubro({ id_rubro_evaluacion: id });
    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Rubro de evaluación eliminado",
      data,
    });
  } catch (error) {
    next(error);
  }
}

// ─── Evaluaciones ──────────────────────────────────────────────────────────────

export async function crearEvaluacionController(req, res, next) {
  try {
    const data = await crearEvaluacion(req.body ?? {});
    return res.status(CREATED).json({
      success: true,
      status_code: CREATED,
      message: "Evaluación creada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function obtenerEvaluacionesController(req, res, next) {
  try {
    const { id_evaluador, finalizada, departamento } = req.query ?? {};
    const data = await obtenerEvaluaciones({ id_evaluador, finalizada, departamento });
    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Evaluaciones obtenidas",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function obtenerEvaluacionPorIdController(req, res, next) {
  try {
    const { id } = req.params ?? {};
    const data = await obtenerEvaluacionPorId({ id_evaluacion: id });
    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Evaluación obtenida",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function finalizarEvaluacionController(req, res, next) {
  try {
    const { id } = req.params ?? {};
    const { calificaciones, plan_accion } = req.body ?? {};
    const data = await finalizarEvaluacion({
      id_evaluacion: id,
      calificaciones,
      plan_accion,
    });
    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Evaluación finalizada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function obtenerEvaluacionesColaboradorController(req, res, next) {
  try {
    const { id_colaborador } = req.params ?? {};
    const data = await obtenerEvaluacionesColaborador({ id_colaborador });
    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Evaluaciones del colaborador obtenidas",
      data,
    });
  } catch (error) {
    next(error);
  }
}
