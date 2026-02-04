import { HTTP_CODES } from "../../../common/strings.js";
import { registrarMarcaAsistencia } from "../handlers/realizarMarca.js";
import { obtenerMarcasDeDia } from "../handlers/consultarMarcasDia.js";
import { obtenerMarcasAsistenciaPorRango } from "../handlers/obtenerMarcasRango.js";
import { actualizarMarcaAsistencia } from "../handlers/actualizarMarca.js";

/**
 * Controller para registrar marca de asistencia
 */
export const marcarAsistencia = async (req, res, next) => {
  try {
    const { identificacion, tipo_marca, timestamp } = req.body;

    if (!identificacion) {
      throw new Error("La identificación es obligatoria");
    }

    if (!tipo_marca) {
      throw new Error("El tipo de marca es obligatorio");
    }

    if (!timestamp) {
      throw new Error("El timestamp es obligatorio");
    }

    const data = await registrarMarcaAsistencia({
      identificacion,
      tipo_marca,
      timestamp,
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

/**
 * Controller para obtener estado de marcas de asistencia por día
 */
export const obtenerEstadoMarcasDia = async (req, res, next) => {
  try {
    const { identificacion, timestamp } = req.query;

    if (!identificacion || String(identificacion).trim() === "") {
      throw new Error("La identificación es obligatoria");
    }

    if (!timestamp || String(timestamp).trim() === "") {
      throw new Error("El timestamp es obligatorio");
    }

    const data = await obtenerMarcasDeDia({ identificacion, timestamp });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta de marcas realizada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para obtener marcas de asistencia por rango de fechas
 */
export const obtenerMarcasPorRango = async (req, res, next) => {
  try {
    const { identificacion, desde, hasta, tipo_marca } = req.query;

    if (!identificacion || String(identificacion).trim() === "") {
      throw new Error("La identificación es obligatoria");
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
      message: "Consulta de marcas realizada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller para actualizar marca de asistencia
 */
export const patchMarcaAsistencia = async (req, res, next) => {
  try {
    const { identificacion, tipo_marca, timestamp, nuevo_timestamp } = req.body;

    if (!identificacion || String(identificacion).trim() === "") {
      throw new Error("La identificación es obligatoria");
    }

    if (!tipo_marca || String(tipo_marca).trim() === "") {
      throw new Error("El tipo de marca es obligatorio");
    }

    if (!timestamp || String(timestamp).trim() === "") {
      throw new Error("El timestamp original es obligatorio");
    }

    if (!nuevo_timestamp || String(nuevo_timestamp).trim() === "") {
      throw new Error("El nuevo timestamp es obligatorio");
    }

    const data = await actualizarMarcaAsistencia({
      identificacion,
      tipo_marca,
      timestamp,
      nuevo_timestamp,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Marca actualizada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};
