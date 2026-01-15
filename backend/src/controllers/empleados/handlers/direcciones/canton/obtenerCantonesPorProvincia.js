import { Canton, Provincia } from "../../../../../models/index.js";

export async function obtenerCantonesPorProvinciaHandler(id_provincia) {
  const provincia = await Provincia.findByPk(id_provincia);

  if (!provincia) {
    const err = new Error("La provincia con el id ingresado no está registrada.");
    err.statusCode = 404;
    throw err;
  }

  const cantones = await Canton.findAll({
    where: { id_provincia: provincia.id_provincia },
    order: [["nombre", "ASC"]],
  });

  return { provincia, cantones };
}
