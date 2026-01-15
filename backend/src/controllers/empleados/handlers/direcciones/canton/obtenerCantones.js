import { Canton } from "../../../../../models/index.js";

export const obtenerCantones = async () => {
  const cantones = await Canton.findAll({
    order: [["nombre", "ASC"]],
  });

  return cantones;
};
