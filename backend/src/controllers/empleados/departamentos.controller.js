import { HTTP_CODES } from "../../common/strings.js";
import { crearNuevoDepartamento } from "./handlers/vinculoLaboral/departamentos/crearNuevoDepartamento.js";
import { obtenerDepartamentos } from "./handlers/vinculoLaboral/departamentos/obtenerDepatamentos.js";

export const crearDepartamento = async (req, res, next) => {
  const { departamento } = req.body;
  try {

    if (!departamento) throw new Error("El departamento es obligatorio");

    const { id, departamento: dpto } = await crearNuevoDepartamento({ nombre: departamento });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Departamento creado correctamente",
      data: {
        id: id,
        departamento: dpto
      }
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
      data
    });
  } catch (error) {
    next(error);
  }
};