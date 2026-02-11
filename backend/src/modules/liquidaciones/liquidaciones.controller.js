import { HTTP_CODES } from "../../common/strings.js";
import { Liquidacion } from "../../models/index.js";
import { crearLiquidacion } from "./handlers/crearLiquidacion.js";
import { listarLiquidaciones } from "./handlers/listarLiquidaciones.js";
import { recalcularLiquidacion } from "./handlers/recalcularLiquidacion.js";
import { simularLiquidacion } from "./handlers/simularLiquidacion.js";

const CREATED = HTTP_CODES.SUCCESS.CREATED;
const OK = HTTP_CODES.SUCCESS.OK;
const BAD_REQUEST = HTTP_CODES.ERROR.CLIENT.BAD_REQUEST;
const UNAUTHORIZED = HTTP_CODES.ERROR.CLIENT.UNAUTHORIZED;
const NOT_FOUND = HTTP_CODES.ERROR.CLIENT.NOT_FOUND;

/**
 * POST /v1/liquidaciones/simular
 * Simula el cálculo de liquidación sin guardar en BD
 */
export async function simularLiquidacionController(req, res, next) {
  try {
    const { idColaborador, causa, fechaTerminacion, realizo_preaviso, salarioDiario } =
      req.body;

    if (!idColaborador) {
      return res.status(BAD_REQUEST).json({
        success: false,
        status_code: BAD_REQUEST,
        message: "idColaborador es requerido",
      });
    }

    const simulacion = await simularLiquidacion(
      idColaborador,
      {
        causa,
        fechaTerminacion,
        realizo_preaviso,
        salarioDiario,
      }
    );

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Simulación de liquidación realizada exitosamente",
      data: simulacion,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /v1/liquidaciones
 * Crea la liquidación en la BD tras confirmación del usuario
 */
export async function crearLiquidacionController(req, res, next) {
  try {
    const { datosLiquidacion } = req.body;
    const idAprobador = req.user?.id_colaborador;

    if (!datosLiquidacion) {
      return res.status(BAD_REQUEST).json({
        success: false,
        status_code: BAD_REQUEST,
        message: "datosLiquidacion es requerido",
      });
    }

    if (!idAprobador) {
      return res.status(UNAUTHORIZED).json({
        success: false,
        status_code: UNAUTHORIZED,
        message: "Usuario no autenticado",
      });
    }

    const resultado = await crearLiquidacion(
      datosLiquidacion.colaborador.id,
      datosLiquidacion,
      idAprobador
    );

    return res.status(CREATED).json({
      success: true,
      status_code: CREATED,
      message: resultado.mensaje,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/liquidaciones
 * Lista liquidaciones con filtros opcionales
 */
export async function listarLiquidacionesController(req, res, next) {
  try {
    const { idColaborador, causa, anio, page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const resultado = await listarLiquidaciones({
      idColaborador: idColaborador ? parseInt(idColaborador) : undefined,
      causa,
      anio: anio ? parseInt(anio) : undefined,
      limit: parseInt(limit),
      offset,
    });

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Liquidaciones listadas exitosamente",
      data: resultado.rows,
      pagination: {
        total: resultado.count,
        page,
        limit,
        pages: Math.ceil(resultado.count / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/liquidaciones/:idCasoTermina
 * Obtiene detalle de una liquidación específica
 */
export async function obtenerDetalleController(req, res, next) {
  try {
    const { idCasoTermina } = req.params;

    const liquidacion = await Liquidacion.findByPk(idCasoTermina, {
      include: [
        {
          model: require("../../../models/index.js").Colaborador,
          as: "colaborador",
          attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        },
      ],
    });

    if (!liquidacion) {
      return res.status(NOT_FOUND).json({
        success: false,
        status_code: NOT_FOUND,
        message: "Liquidación no encontrada",
      });
    }

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Detalle de liquidación obtenido",
      data: liquidacion,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /v1/liquidaciones/:idCasoTermina
 * Recalcula una liquidación existente
 */
export async function recalcularLiquidacionController(req, res, next) {
  try {
    const { idCasoTermina } = req.params;
    const { datosActualizados } = req.body;

    if (!datosActualizados) {
      return res.status(BAD_REQUEST).json({
        success: false,
        status_code: BAD_REQUEST,
        message: "datosActualizados es requerido",
      });
    }

    const resultado = await recalcularLiquidacion(
      parseInt(idCasoTermina),
      datosActualizados
    );

    if (!resultado.success) {
      return res.status(BAD_REQUEST).json({
        success: false,
        status_code: BAD_REQUEST,
        message: resultado.mensaje,
      });
    }

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: resultado.mensaje,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/liquidaciones/:idCasoTermina/pdf
 * Genera PDF de la liquidación
 */
export async function generarPDFController(req, res, next) {
  try {
    const { idCasoTermina } = req.params;

    const liquidacion = await Liquidacion.findByPk(idCasoTermina);

    if (!liquidacion) {
      return res.status(NOT_FOUND).json({
        success: false,
        status_code: NOT_FOUND,
        message: "Liquidación no encontrada",
      });
    }

    // Implementar generación de PDF aquí
    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "PDF en desarrollo",
      data: { idCasoTermina },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /v1/liquidaciones/exportar/excel
 * Exporta liquidaciones a Excel
 */
export async function exportarExcelController(req, res, next) {
  try {
    const { idColaborador, anio } = req.query;

    // Implementar exportación a Excel aquí
    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Exportación a Excel en desarrollo",
      data: { idColaborador, anio },
    });
  } catch (error) {
    next(error);
  }
}
