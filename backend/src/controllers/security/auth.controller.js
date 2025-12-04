import { HTTP_CODES } from "../../common/strings.js";
import { autenticarUsuario } from "./handlers/autenticarUsuario.js";

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