import { HTTP_CODES } from "../../common/strings.js";
import { crearColaborador } from "./handlers/empleados/crearColaborador.js";
import { modificarColaborador } from "./handlers/empleados/modificarColaborador.js";
import { obtenerColaboradores, obtenerColaboradorPorIdUsuario } from "./handlers/empleados/obtenerColaborador.js";
import { obtenerFullEmpleadoPorIdColaborador } from "./handlers/empleados/obtenerColaboradorFull.js";

export const crearEmpleado = async (req, res, next) => {
  const {
    nombre,
    primer_apellido,
    segundo_apellido,
    genero,
    identificacion,
    fecha_nacimiento,
    correo_electronico,
    fecha_ingreso,
    cantidad_hijos,
    estado_civil,
    telefono,
    rol,
    direccion
  } = req.body;
  try {

    const requiredFields = [
      "nombre",
      "primer_apellido",
      "segundo_apellido",
      "genero",
      "identificacion",
      "fecha_nacimiento",
      "correo_electronico",
      "fecha_ingreso",
      "cantidad_hijos",
      "estado_civil",
      "telefono",
      "rol",
      "direccion"
    ];

    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    const { id, username, rol_asignado } = await crearColaborador({
      nombre,
      primer_apellido,
      segundo_apellido,
      genero,
      identificacion,
      fecha_nacimiento,
      correo_electronico,
      fecha_ingreso,
      cantidad_hijos,
      estado_civil,
      telefono,
      rol,
      direccion
    })

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Empleado y usuario creados correctamente",
      data: {
        id,
        username,
        rol_asignado,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerColaboradorPorUserId = async (req, res, next) => {
  const {
    id
  } = req.params;
  try {

    const data = await obtenerColaboradorPorIdUsuario({ id })

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

export const obtenerTodosColaboradores = async (_req, res, next) => {
  try {
    const data = await obtenerColaboradores();

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

export const patchColaborador = async (req, res, next) => {
  const { id } = req.params;

  try {
    const patch = req.body;

    const data = await modificarColaborador({
      id_colaborador: id,
      patch,
    });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Colaborador actualizado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerFullColaborador = async (req, res, next) => {
  const { id } = req.params;

  try {
    const data = await obtenerFullEmpleadoPorIdColaborador({ id_colaborador: id });

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