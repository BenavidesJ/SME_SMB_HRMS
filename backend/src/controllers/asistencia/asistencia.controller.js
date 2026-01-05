import { HTTP_CODES } from "../../common/strings.js";
import { crearNuevoTipoMarca } from "./handlers/crearTipoMarca.js";
import { obtenerTiposMarca } from "./handlers/obtenerTiposMarca.js";
import { registrarMarcaAsistencia } from "./handlers/realizarMarca.js";
import { obtenerMarcasAsistenciaPorRango } from "./handlers/obtenerMarcas.js";

export const crearTipoMarca = async (req, res, next) => {
  const { tipo_marca } = req.body;
  try {

    if (!tipo_marca) throw new Error("El tipo de marca es obligatorio");

    const { id, tipo_marca: marca } = await crearNuevoTipoMarca({ tipo: tipo_marca });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Tipo de Marca creado correctamente",
      data: {
        id: id,
        tipo_marca: marca
      }
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosTiposMarca = async (_req, res, next) => {
  try {
    const data = await obtenerTiposMarca();

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

export const marcarAsistencia = async (req, res, next) => {
  try {
    const { identificacion, tipo_marca, timestamp } = req.body;

    const data = await registrarMarcaAsistencia({
      identificacion,
      tipo_marca,
      timestamp
    });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Marca registrada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerMarcasPorRango = async (req, res, next) => {
  try {
    const { identificacion, desde, hasta, tipo_marca } = req.query;

    if (!identificacion || String(identificacion).trim() === "") {
      throw new Error("identificacion es obligatoria");
    }
    if (!desde || String(desde).trim() === "") {
      throw new Error("desde es obligatorio (YYYY-MM-DD)");
    }
    if (!hasta || String(hasta).trim() === "") {
      throw new Error("hasta es obligatorio (YYYY-MM-DD)");
    }

    const data = await obtenerMarcasAsistenciaPorRango({
      identificacion,
      desde,
      hasta,
      tipo_marca,
    });

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
