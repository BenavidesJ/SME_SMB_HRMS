import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

const serialize = (rol) => ({ id: rol.id_rol, nombre: rol.nombre });

export const listRoles = async () =>
  (await models.Rol.findAll({ order: [["id_rol", "ASC"]] })).map(serialize);

export const getRol = async ({ id }) => {
  const rid = requirePositiveInt(id, "id");
  const rol = await models.Rol.findByPk(rid);
  if (!rol) throw new Error(`No existe rol con id ${rid}`);
  return serialize(rol);
};
