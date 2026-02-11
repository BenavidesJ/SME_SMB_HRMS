import { HTTP_CODES } from "../../../common/strings.js";
import { autenticarUsuario } from "../handlers/autenticacion.js";
import { cambiarPassword } from "../handlers/cambioPassword.js";
import { resetPasswordOlvidado } from "../handlers/resetPasswordOlvidado.js";

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body ?? {};
    const data = await autenticarUsuario({ username, password });

    res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Usuario autenticado correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const cambioPassword = async (req, res, next) => {
  try {
    const { password_anterior, password_nuevo } = req.body ?? {};
    const userId = req.user?.id;

    await cambiarPassword({ id: userId, password_anterior, password_nuevo });

    res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Contraseña actualizada correctamente",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { username } = req.body ?? {};
    await resetPasswordOlvidado({ username });

    res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Contraseña actualizada correctamente",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
