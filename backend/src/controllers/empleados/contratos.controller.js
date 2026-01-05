import { HTTP_CODES } from "../../common/strings.js";
import { crearNuevoContrato } from "./handlers/vinculoLaboral/contratos/crearContrato.js";
import { crearNuevoTipoContrato } from "./handlers/vinculoLaboral/contratos/crearTipoContrato.js";
import { editarContratoExistente } from "./handlers/vinculoLaboral/contratos/editarContrato.js";
import { obtenerContratosPorColaborador } from "./handlers/vinculoLaboral/contratos/obtenerContrato.js";
import { obtenerTiposContrato } from "./handlers/vinculoLaboral/contratos/obtenerTiposContrato.js";

export const crearTipoContrato = async (req, res, next) => {
  const { tipo } = req.body;
  try {
    if (!tipo || String(tipo).trim() === "") {
      throw new Error("El tipo de contrato es obligatorio");
    }

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

export const crearContrato = async (req, res, next) => {
  try {
    const {
      id_colaborador,
      puesto,
      fecha_inicio,
      tipo_contrato,
      tipo_jornada,
      salario_base,
      ciclo_pago,
      horas_semanales,
      horario,
    } = req.body;

    const requiredFields = {
      id_colaborador,
      puesto,
      fecha_inicio,
      tipo_contrato,
      tipo_jornada,
      salario_base,
      ciclo_pago,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (value === undefined || value === null || String(value).trim() === "") {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    const idCol = Number(id_colaborador);
    if (!Number.isInteger(idCol) || idCol <= 0) {
      throw new Error("id_colaborador debe ser un número entero válido");
    }

    const result = await crearNuevoContrato({
      id_colaborador: idCol,
      puesto,
      fecha_inicio,
      tipo_contrato,
      tipo_jornada,
      salario_base,
      ciclo_pago,
      horas_semanales,
      horario,
    });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Contrato creado correctamente",
      data: {
        ...result,
      },
      warnings: result.warnings ?? [],
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

export const editarContrato = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || String(id).trim() === "") {
      throw new Error("El parámetro id es obligatorio");
    }

    const idContrato = Number(id);
    if (!Number.isInteger(idContrato) || idContrato <= 0) {
      throw new Error("El parámetro id debe ser un entero válido");
    }

    const patch = req.body;

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new Error("El body debe ser un objeto con los campos a actualizar");
    }
    if (Object.keys(patch).length === 0) {
      throw new Error("Debe enviar al menos un campo a actualizar");
    }

    if ("id_contrato" in patch) {
      throw new Error("No se permite modificar id_contrato");
    }

    const result = await editarContratoExistente({
      id_contrato: idContrato,
      patch,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Contrato actualizado correctamente",
      data: {
        id: result.id,
        id_colaborador: result.id_colaborador,
        id_puesto: result.id_puesto,
        fecha_inicio: result.fecha_inicio,
        id_tipo_contrato: result.id_tipo_contrato,
        id_tipo_jornada: result.id_tipo_jornada,
        horas_semanales: result.horas_semanales,
        salario_base: result.salario_base,
        id_ciclo_pago: result.id_ciclo_pago,
        estado: result.estado,
      },
      warnings: result.warnings ?? [],
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerContratosDeColaborador = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || String(id).trim() === "") {
      throw new Error("El parámetro ID es obligatorio");
    }

    const idCol = Number(id);
    if (!Number.isInteger(idCol) || idCol <= 0) {
      throw new Error("El parámetro ID debe ser un entero válido");
    }

    const data = await obtenerContratosPorColaborador({ id_colaborador: idCol });

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