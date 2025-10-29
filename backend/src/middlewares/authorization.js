import jwt from 'jsonwebtoken';
import { HTTP_CODES } from '../common/strings.js';

export const authorization = (req, res, next) => {
  //  Bearer <token>
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(HTTP_CODES.ERROR.CLIENT.UNAUTHORIZED).json({
      success: false,
      status_code: HTTP_CODES.ERROR.CLIENT.UNAUTHORIZED,
      message: 'No se proporcionó token de autenticación. No autorizado',
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(HTTP_CODES.ERROR.CLIENT.UNAUTHORIZED).json({
      success: false,
      status_code: HTTP_CODES.ERROR.CLIENT.UNAUTHORIZED,
      message: 'Token de autenticación no válido.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.dataUsuario;
    next();
  } catch (error) {
    return res.status(HTTP_CODES.ERROR.CLIENT.UNAUTHORIZED).json({
      success: false,
      status_code: HTTP_CODES.ERROR.CLIENT.UNAUTHORIZED,
      message: 'Token de autenticación inválido o expirado.',
    });
  }
};