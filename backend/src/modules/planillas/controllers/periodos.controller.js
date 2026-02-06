import { HTTP_CODES } from "../../../common/strings.js";
import { createPeriodoPlanilla } from "../handlers/periodos/createPeriodo.js";
import { listPeriodosPlanilla } from "../handlers/periodos/listPeriodos.js";
import { getPeriodoPlanilla } from "../handlers/periodos/getPeriodo.js";
import { updatePeriodoPlanilla } from "../handlers/periodos/updatePeriodo.js";
import { deletePeriodoPlanilla } from "../handlers/periodos/deletePeriodo.js";

const { SUCCESS } = HTTP_CODES;

export async function createPeriodoPlanillaController(req, res, next) {
  try {
    const data = await createPeriodoPlanilla(req.body ?? {});
    return res.status(SUCCESS.CREATED).json({
      success: true,
      status_code: SUCCESS.CREATED,
      message: "Periodo de planilla creado",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listPeriodosPlanillaController(req, res, next) {
  try {
    const data = await listPeriodosPlanilla();
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Periodos de planilla recuperados",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPeriodoPlanillaController(req, res, next) {
  try {
    const data = await getPeriodoPlanilla({ id: req.params?.id });
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Periodo de planilla recuperado",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePeriodoPlanillaController(req, res, next) {
  try {
    const data = await updatePeriodoPlanilla({ id: req.params?.id, patch: req.body ?? {} });
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Periodo de planilla actualizado",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePeriodoPlanillaController(req, res, next) {
  try {
    const data = await deletePeriodoPlanilla({ id: req.params?.id });
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Periodo de planilla eliminado",
      data,
    });
  } catch (error) {
    next(error);
  }
}
