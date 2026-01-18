import { HTTP_CODES } from "../../common/strings.js";
import { crearNuevoAguinaldo } from "./handlers/crearAguinaldo.js";

export const crearAguinaldo = async (req, res, next) => {
  try {
    const {
      id_colaborador,
      anio,
      periodo_desde,
      periodo_hasta,
      monto_calculado,
      fecha_pago,
    } = req.body;

    const requiredFields = [
      "id_colaborador",
      "anio",
      "periodo_desde",
      "periodo_hasta",
      "monto_calculado",
      "fecha_pago",
    ];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    const data = await crearNuevoAguinaldo({
      id_colaborador,
      anio,
      periodo_desde,
      periodo_hasta,
      monto_calculado,
      fecha_pago,
      registrado_por,
    });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Aguinaldo creado exitosamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};
