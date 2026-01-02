import { HTTP_CODES } from "../../common/strings.js";
import { crearNuevoGenero } from "./handlers/genero/crearNuevoGenero.js";
import { obtenerGeneros } from "./handlers/genero/obtenerGeneros.js";

export const crearGenero = async (req, res, next) => {
  const { genero } = req.body;
  try {

    if (!genero) throw new Error("El género es obligatorio");

    const { id, genero: gen } = await crearNuevoGenero({ genero });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Género creado correctamente",
      data: {
        id: id,
        genero: gen
      }
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosGeneros = async (_req, res, next) => {
  try {
    const data = await obtenerGeneros();

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