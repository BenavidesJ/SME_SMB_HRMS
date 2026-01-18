import { Canton } from "../../../../../models/index.js";

export async function obtenerCantonPorIdHandler(id) {
  const canton = await Canton.findByPk(id);

  if (!canton) {
    const err = new Error("El cantón con el id ingresado no está registrado.");
    err.statusCode = 404;
    throw err;
  }

  return canton;
}
