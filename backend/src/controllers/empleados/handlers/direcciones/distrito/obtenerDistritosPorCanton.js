import { Canton, Distrito } from "../../../../../models/index.js";

export async function obtenerDistritosPorCantonHandler(id_canton) {
  const canton = await Canton.findByPk(id_canton);

  if (!canton) {
    const err = new Error("El cantón con el id ingresado no está registrado.");
    err.statusCode = 404;
    throw err;
  }

  const distritos = await Distrito.findAll({
    where: { id_canton: canton.id_canton },
    order: [["nombre", "ASC"]],
  });

  return { canton, distritos };
}
