import { HTTP_CODES } from "../../common/strings.js";
import { actualizarDepartamento } from "./handlers/vinculoLaboral/departamentos/actualizarDepartamento.js";
import { crearNuevoDepartamento } from "./handlers/vinculoLaboral/departamentos/crearNuevoDepartamento.js";
import { eliminarDepartamento } from "./handlers/vinculoLaboral/departamentos/eliminarDepartamento.js";
import { obtenerDepartamentoPorId } from "./handlers/vinculoLaboral/departamentos/obtenerDepartamento.js";
import { obtenerDepartamentos } from "./handlers/vinculoLaboral/departamentos/obtenerDepatamentos.js";

export const crearDepartamento = async (req, res, next) => {
  try {
    const { departamento } = req.body;
    if (!departamento || String(departamento).trim() === "") {
      throw new Error("El departamento es obligatorio");
    }

    const { id, departamento: dpto } = await crearNuevoDepartamento({ nombre: departamento });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Departamento creado correctamente",
      data: { id, departamento: dpto },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosDepartamentos = async (_req, res, next) => {
  try {
    const data = await obtenerDepartamentos();
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

export const obtenerDepartamento = async (req, res, next) => {
  try {
    const data = await obtenerDepartamentoPorId({ id: req.params.id });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Consulta exitosa",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const patchDepartamento = async (req, res, next) => {
  try {
    const data = await actualizarDepartamento({
      id: req.params.id,
      patch: req.body,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Departamento actualizado",
      data,
    });
  } catch (e) {
    next(e);
  }
};

export const borrarDepartamento = async (req, res, next) => {
  try {
    const data = await eliminarDepartamento({ id: req.params.id });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Departamento eliminado",
      data,
    });
  } catch (e) {
    next(e);
  }
};