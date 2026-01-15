import { Provincia } from "../../../../../models/index.js";

export async function obtenerProvinciasHandler() {
  return await Provincia.findAll({
    order: [["nombre", "ASC"]],
  });
}
