
import { HTTP_CODES } from '../common/strings.js';

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode ?? HTTP_CODES.ERROR.CLIENT.BAD_REQUEST;

  return res.status(statusCode).json({
    success: false,
    status_code: statusCode,
    message: err.message,
    ...(Array.isArray(err.errores) ? { errors: err.errores } : {}),
  });
}