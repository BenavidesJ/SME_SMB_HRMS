import { HTTP_CODES } from "../../common/strings.js";
import { crearIncapacidad } from "./handlers/incapacidad/crearIncapacidad.js";
import { editarIncapacidad } from "./handlers/incapacidad/editarIncapacidad.js";
import { obtenerIncapacidadesPorRango } from "./handlers/incapacidad/obtenerIncapacidadesPorRango.js";
import { obtenerIncapacidadesPorColaborador } from "./handlers/incapacidad/obtenerIncapacidadPorColaborador.js";
import { crearTipoIncapacidad } from "./handlers/tipoIncapacidad/crearTipoIncapacidad.js";
import { actualizarTipoIncapacidad } from "./handlers/tipoIncapacidad/editarTipoIncapacidad.js";
import { eliminarTipoIncapacidad } from "./handlers/tipoIncapacidad/eliminarTipoIncapacidad.js";
import { obtenerTipoIncapacidadPorId } from "./handlers/tipoIncapacidad/obtenerTipo.js";
import { obtenerTiposIncapacidad } from "./handlers/tipoIncapacidad/obtenerTipos.js";

export const postIncapacidad = async (req, res, next) => {
  try {
    const data = await crearIncapacidad({ ...req.body });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Incapacidad registrada correctamente",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const patchIncapacidad = async (req, res, next) => {
  try {
    const id_incapacidad = Number(req.params.id);

    const data = await editarIncapacidad({
      id_incapacidad,
      ...req.body,
    });


    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Incapacidad actualizada correctamente",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getIncapacidadesByColaborador = async (req, res, next) => {
  try {
    const id_colaborador = Number(req.params.id);
    const { desde, hasta } = req.query;

    const data = await obtenerIncapacidadesPorColaborador({
      id_colaborador,
      fromDateStr: desde,
      toDateStr: hasta,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const getIncapacidadesByRango = async (req, res, next) => {
  try {
    const { desde, hasta } = req.query;

    const data = await obtenerIncapacidadesPorRango({
      fromDateStr: desde,
      toDateStr: hasta,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Tipos de Incapacidad
const toNumberId = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new Error("ID inválido");
  return n;
};

const sanitizeText = (value, maxLen, fieldName) => {
  const v = String(value ?? "").trim();
  if (!v) throw new Error(`${fieldName} es obligatorio`);
  if (v.length > maxLen) throw new Error(`${fieldName} no puede exceder ${maxLen} caracteres`);
  return v;
};


export const crearTipoIncapacidadController = async (req, res, next) => {
  try {
    const nombre = sanitizeText(req.body?.nombre, 40, "nombre");

    const data = await crearTipoIncapacidad({ nombre });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Tipo de incapacidad creado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTiposIncapacidadController = async (_req, res, next) => {
  try {
    const data = await obtenerTiposIncapacidad();

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

export const obtenerTipoIncapacidadPorIdController = async (req, res, next) => {
  try {
    const id_tipo_incap = toNumberId(req.params?.id);
    const data = await obtenerTipoIncapacidadPorId({ id_tipo_incap });

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

export const actualizarTipoIncapacidadController = async (req, res, next) => {
  try {
    const id_tipo_incap = toNumberId(req.params?.id);

    const payload = {};
    if (req.body?.nombre !== undefined) payload.nombre = sanitizeText(req.body?.nombre, 40, "nombre");

    if (Object.keys(payload).length === 0) {
      throw new Error("Debe enviar al menos un campo para actualizar");
    }

    const data = await actualizarTipoIncapacidad({ id_tipo_incap, ...payload });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Tipo de incapacidad actualizado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarTipoIncapacidadController = async (req, res, next) => {
  try {
    const id_tipo_incap = toNumberId(req.params?.id);

    const data = await eliminarTipoIncapacidad({ id_tipo_incap });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Tipo de incapacidad eliminado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};