import { HTTP_CODES } from "../../../common/strings.js";
import { calcularLoteAguinaldo } from "../handlers/calcularLoteAguinaldo.js";
import { crearLoteAguinaldo } from "../handlers/crearLoteAguinaldo.js";
import { recalcularAguinaldos } from "../handlers/recalcularAguinaldos.js";
import { listarAguinaldos } from "../handlers/listarAguinaldos.js";

const { SUCCESS } = HTTP_CODES;

export async function calcularLoteAguinaldoController(req, res, next) {
  try {
    const data = await calcularLoteAguinaldo(req.body ?? {});
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Simulación de aguinaldo generada",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function crearLoteAguinaldoController(req, res, next) {
  try {
    const data = await crearLoteAguinaldo(req.body ?? {});
    return res.status(SUCCESS.CREATED).json({
      success: true,
      status_code: SUCCESS.CREATED,
      message: data.mensaje,
      data,
    });
  } catch (error) {
    if (error.statusCode === 409) {
      return res.status(409).json({
        success: false,
        status_code: 409,
        message: error.message,
        data: error.data,
      });
    }
    next(error);
  }
}

export async function recalcularAguinaldosController(req, res, next) {
  try {
    const data = await recalcularAguinaldos(req.body ?? {});
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: `${data.total_recalculados} aguinaldo(s) recalculado(s) exitosamente.`,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listarAguinaldosController(req, res, next) {
  try {
    const { anio, id_colaborador } = req.query;
    const data = await listarAguinaldos({
      anio: anio ? Number(anio) : undefined,
      id_colaborador: id_colaborador ? Number(id_colaborador) : undefined,
    });
    return res.status(SUCCESS.OK).json({
      success: true,
      status_code: SUCCESS.OK,
      message: "Aguinaldos consultados",
      data,
    });
  } catch (error) {
    next(error);
  }
}
