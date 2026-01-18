import { Distrito } from "../../../../../models/index.js";

export async function obtenerDistritoPorIdHandler(id) {
  const distrito = await Distrito.findByPk(id);

  if (!distrito) {
    const err = new Error("El distrito con el id ingresado no está registrado.");
    err.statusCode = 404;
    throw err;
  }

  return distrito;
}
