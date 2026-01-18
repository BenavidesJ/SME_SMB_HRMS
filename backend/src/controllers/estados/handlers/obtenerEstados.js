import { Estado } from "../../../models/index.js";

export const obtenerEstados = async () =>
  (await Estado.findAll({ order: [["id_estado", "ASC"]] }))
    .map(e => ({ id: e.id_estado, estado: e.estado }));
