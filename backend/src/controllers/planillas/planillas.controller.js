import { HTTP_CODES } from "../../common/strings.js";
import { crearNuevoCicloPago } from "./handlers/pagos/crearCicloPagos.js";
import { obtenerCiclosPago } from "./handlers/pagos/obtenerCiclosPago.js";


export const crearCicloPago = async (req, res, next) => {
  const { ciclo } = req.body;
  try {

    if (!ciclo) throw new Error("El nombre del ciclo es obligatorio");

    const { id, ciclo: cicloPago } = await crearNuevoCicloPago({ nombre: ciclo });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Ciclo de pago creado correctamente",
      data: {
        id: id,
        ciclo_pago: cicloPago
      }
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosCiclos = async (_req, res, next) => {
  try {
    const data = await obtenerCiclosPago();

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