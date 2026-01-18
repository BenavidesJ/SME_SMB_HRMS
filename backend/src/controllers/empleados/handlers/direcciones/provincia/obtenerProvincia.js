import { Provincia } from "../../../../../models/index.js";

export async function obtenerProvinciaPorIdHandler(id) {
  const provincia = await Provincia.findByPk(id);

  if (!provincia) {
    const err = new Error("La provincia con el id ingresado no está registrada.");
    err.statusCode = 404;
    throw err;
  }

  return provincia;
}
