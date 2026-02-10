import { HTTP_CODES } from "../../../common/strings.js";
import { registrarIncapacidad } from "../handlers/registrarIncapacidad.js";
import { listarIncapacidadesPorColaborador } from "../handlers/listarIncapacidadesPorColaborador.js";
import { extenderIncapacidad } from "../handlers/extenderIncapacidad.js";

const CREATED = HTTP_CODES.SUCCESS.CREATED;
const OK = HTTP_CODES.SUCCESS.OK;

export async function registrarIncapacidadController(req, res, next) {
  try {
    const data = await registrarIncapacidad(req.body ?? {});

    return res.status(CREATED).json({
      success: true,
      status_code: CREATED,
      message: "Incapacidad registrada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function listarIncapacidadesPorColaboradorController(req, res, next) {
  try {
    const idColaborador = req.params?.id ?? req.body?.id_colaborador;

    const data = await listarIncapacidadesPorColaborador({
      id_colaborador: idColaborador,
    });

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Consulta de incapacidades exitosa",
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function extenderIncapacidadController(req, res, next) {
  try {
    const { grupo } = req.params;
    const { fecha_fin } = req.body ?? {};

    const data = await extenderIncapacidad({ grupo, fecha_fin });

    return res.status(OK).json({
      success: true,
      status_code: OK,
      message: "Incapacidad extendida correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
}
