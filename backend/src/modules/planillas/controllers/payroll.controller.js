import { HTTP_CODES } from "../../../common/strings.js";
import { generarPlanillaQuincenal } from "../handlers/payroll/generatePayroll.js";
import { simularPlanillaQuincenal } from "../handlers/payroll/simularPlanilla.js";
import { recalcularPlanilla } from "../handlers/payroll/recalcularPlanilla.js";
import { obtenerDetallePlanilla } from "../handlers/payroll/getPayrollDetails.js";
import { eliminarPlanilla } from "../handlers/payroll/deletePlanilla.js";
import { editarPlanilla } from "../handlers/payroll/editPlanilla.js";

const { SUCCESS } = HTTP_CODES;

export async function simularPlanillaController(req, res, next) {
  try {
    const data = await simularPlanillaQuincenal(req.body ?? {});
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Simulación de planilla generada",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function generarPlanillaController(req, res, next) {
  try {
    const data = await generarPlanillaQuincenal(req.body ?? {});
    return res.status(SUCCESS.CREATED).json({
      success: true,
      status_code: SUCCESS.CREATED,
      message: "Planilla generada",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function recalcularPlanillaController(req, res, next) {
  try {
    const data = await recalcularPlanilla(req.body ?? {});
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Planilla recalculada",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function obtenerDetallePlanillaController(req, res, next) {
  try {
    const data = await obtenerDetallePlanilla(req.body ?? {});
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Detalle de planilla recuperado",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function eliminarPlanillaController(req, res, next) {
  try {
    const data = await eliminarPlanilla({ id_detalle: Number(req.params.id) });
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Planilla eliminada",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function editarPlanillaController(req, res, next) {
  try {
    const data = await editarPlanilla({
      id_detalle: Number(req.params.id),
      datos: req.body?.datos ?? {},
      recalcular_deducciones: req.body?.recalcular_deducciones ?? false,
    });
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Planilla actualizada",
      data,
    });
  } catch (error) {
    next(error);
  }
}
