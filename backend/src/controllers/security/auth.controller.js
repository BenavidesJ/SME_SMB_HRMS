import { HTTP_CODES } from "../../common/strings.js";
import { autenticarUsuario } from "./handlers/autenticarUsuario.js";
import { cambiarPassword } from "./handlers/cambiarPassword.js";
import { resetPasswordOlvidado } from "./handlers/resetPasswordOlvidado.js";

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
      message: "Usuario autenticado correctamente",
      data: {}
    });
  } catch (error) {
    next(error);
  }
};