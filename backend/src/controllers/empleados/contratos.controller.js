import { HTTP_CODES } from "../../common/strings.js";
import { crearNuevoTipoContrato } from "./handlers/vinculoLaboral/contratos/crearTipoContrato.js";
import { obtenerTiposContrato } from "./handlers/vinculoLaboral/contratos/obtenerTiposContrato.js";

export const crearTipoContrato = async (req, res, next) => {
  const { tipo } = req.body;
  try {
    if (!tipo) throw new Error("El tipo de contrato es obligatorio");

    const { id, tipo_contrato: contractType } = await crearNuevoTipoContrato({ tipo });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Tipo de contrato creado correctamente",
      data: {
        id: id,
        tipo_contrato: contractType
      }
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosTiposContrato = async (_req, res, next) => {
  try {
    const data = await obtenerTiposContrato();

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