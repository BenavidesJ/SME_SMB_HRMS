import { HTTP_CODES } from "../../../common/strings.js";
import { getCalendarioEventosByToken } from "../services/calendario.service.js";

const OK = HTTP_CODES.SUCCESS.OK;

export async function getCalendarioEventosController(req, res, next) {
  try {
    const data = await getCalendarioEventosByToken({
      tokenId: req.user?.id,
      from: req.query?.from,
      to: req.query?.to,
    });

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Eventos de calendario recuperados correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
}
