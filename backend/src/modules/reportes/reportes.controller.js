import { HTTP_CODES } from "../../common/strings.js";
import {
  REPORTS_CATALOG,
  getReporteData,
  parseReportQuery,
} from "./services/reportes.service.js";

const OK = HTTP_CODES.SUCCESS.OK;
const BAD_REQUEST = HTTP_CODES.ERROR.CLIENT.BAD_REQUEST;

export async function getCatalogoReportesController(_req, res, next) {
  try {
    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Catálogo de reportes obtenido exitosamente",
      data: REPORTS_CATALOG,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReporteDataController(req, res, next) {
  try {
    const { reporteKey } = req.params;
    const query = parseReportQuery(req.query);

    if (!REPORTS_CATALOG.some((r) => r.key === reporteKey)) {
      return res.status(BAD_REQUEST).json({
        success: false,
        status_code: BAD_REQUEST,
        message: "Reporte no soportado",
      });
    }

    const result = await getReporteData(reporteKey, query);

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Reporte generado exitosamente",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
