
import { HTTP_CODES } from '../common/strings.js';

export function errorHandler(err, _req, res, _next) {

  return res.status(HTTP_CODES.ERROR.CLIENT.BAD_REQUEST).json({
    success: false,
    status_code: HTTP_CODES.ERROR.CLIENT.BAD_REQUEST,
    message: err.message,
  });
}