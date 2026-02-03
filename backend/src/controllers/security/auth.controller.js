// This file has been removed as it is replaced by module implementation.
import { HTTP_CODES } from "../../common/strings.js";
import { autenticarUsuario } from "./handlers/autenticarUsuario.js";
import { cambiarPassword } from "./handlers/cambiarPassword.js";
import { crearNuevoRol } from "./handlers/roles/crearRol.js";
import { obtenerTodosRoles } from "./handlers/roles/obtenerRoles.js";
import { resetPasswordOlvidado } from "./handlers/resetPasswordOlvidado.js";
import { obtenerRolPorId } from "./handlers/roles/obtenerRol.js";
import { actualizarRol } from "./handlers/roles/actualizarRol.js";
import { eliminarRol } from "./handlers/roles/eliminarRol.js";
import { obtenerEstadoPorId } from "../estados/handlers/obtenerEstado.js";

// Autenticacion
export const login = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const authData = await autenticarUsuario({ username, password })

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Usuario autenticado correctamente",
      data: authData
    });
  } catch (error) {
    next(error);
  }
};

// Seguridad
export const cambioPassword = async (req, res, next) => {
  const { password_anterior, password_nuevo } = req.body;
  try {
    const userId = req.user.id;

    await cambiarPassword({ id: userId, password_anterior, password_nuevo });

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Contraseña actualizada correctamente",
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const { username } = req.body;
  try {
    await resetPasswordOlvidado(username)

    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Contraseña actualizada correctamente",
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

// Seguridad - Roles
export const obtenerRoles = async (_req, res, next) => {
  try {
    const data = await obtenerTodosRoles();

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

export const obtenerRol = async (req, res, next) => {
  try {
    const data = await obtenerEstadoPorId({ id: req.params.id });

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

export const crearRol = async (req, res, next) => {
  const { nombre } = req.body;
  try {
    const { id, rol: role } = await crearNuevoRol({ nombre });

    return res.status(HTTP_CODES.SUCCESS.CREATED).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.CREATED,
      message: "Rol creado correctamente",
      data: {
        id: id,
        rol: role
      }
    });
  } catch (error) {
    next(error);
  }
};

export const patchRol = async (req, res, next) => {
  try {
    const data = await actualizarRol({ id: req.params.id, patch: req.body });
    res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true, status_code: HTTP_CODES.SUCCESS.OK,
      message: "Rol actualizado", 
      data,
    });
  } catch (error) { 
    next(error); 
  }
};

export const borrarRol = async (req, res, next) => {
  try {
    const data = await eliminarRol({ id: req.params.id });
    res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true, status_code: HTTP_CODES.SUCCESS.OK,
      message: "Rol actualizado", 
      data,
    });
  } catch (error) { 
    next(error); 
  }
};