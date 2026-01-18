import { Distrito } from "../../../../../models/index.js";

export const obtenerDistritos = async () => {
  const distritos = await Distrito.findAll({
    order: [["nombre", "ASC"]],
  });

  return distritos;
};
