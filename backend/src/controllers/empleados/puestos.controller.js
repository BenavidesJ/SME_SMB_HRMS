
import { HTTP_CODES } from "../../common/strings.js";
import { actualizarPuesto } from "./handlers/vinculoLaboral/puestos/actualizarPuesto.js";
import { crearNuevoPuesto } from "./handlers/vinculoLaboral/puestos/crearNuevoPuesto.js";
import { eliminarPuesto } from "./handlers/vinculoLaboral/puestos/eliminarPuesto.js";
import { obtenerPuestoPorId } from "./handlers/vinculoLaboral/puestos/obtenerPuesto.js";
import { obtenerPuestos } from "./handlers/vinculoLaboral/puestos/obtenerPuestos.js";

export const crearPuesto = async (req, res, next) => {
  try {
    const {
      nombre,
      departamento,
      sal_base_referencia_min,
      sal_base_referencia_max,
    } = req.body;

    const requiredFields = {
      nombre,
      departamento,
      sal_base_referencia_min,
      sal_base_referencia_max,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || String(value).trim() === "") {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    const min = Number(sal_base_referencia_min);
    const max = Number(sal_base_referencia_max);

    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error("Los salarios deben ser valores numéricos");
    }

    if (min < 0 || max < 0) {
      throw new Error("Los salarios no pueden ser negativos");
    }

    if (min > max) {
      throw new Error(
        "El salario base mínimo no puede ser mayor al salario base máximo"
      );
    }

    const {
      id,
      departamento: departamentoNombre,
      puesto,
      salario_ref_minimo,
      salario_ref_maximo,
      estado,
    } = await crearNuevoPuesto({
      nombre,
      departamento,
      sal_base_referencia_min,
      sal_base_referencia_max,
    });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Puesto creado correctamente",
      data: {
        id,
        departamento: departamentoNombre,
        puesto,
        salario_ref_minimo,
        salario_ref_maximo,
        estado,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerTodosPuestos = async (_req, res, next) => {
  try {
    const data = await obtenerPuestos();

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
export const obtenerPuesto = async (req, res, next) => {
  try {
    const data = await obtenerPuestoPorId({ id: req.params.id });

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

export const patchPuesto = async (req, res, next) => {
  try {
    const data = await actualizarPuesto({
      id: req.params.id,
      patch: req.body,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Puesto actualizado",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const borrarPuesto = async (req, res, next) => {
  try {
    const data = await eliminarPuesto({ id: req.params.id });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Puesto marcado como INACTIVO",
      data,
    });
  } catch (e) { next(e); }
};