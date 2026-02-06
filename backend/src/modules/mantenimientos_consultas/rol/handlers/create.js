import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

const serialize = (rol) => ({
  id: rol.id_rol,
  nombre: rol.nombre,
  id_usuario: rol.id_usuario,
});

export const createRol = (payload) =>
  runInTransaction(async (transaction) => {
    const nombre = requireNonEmptyString(payload.nombre, "nombre");
    const idUsuario = requirePositiveInt(payload.id_usuario, "id_usuario");

    const usuario = await models.Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) throw new Error(`No existe usuario con id ${idUsuario}`);

    const duplicate = await models.Rol.findOne({
      where: { id_usuario: idUsuario, nombre },
      transaction,
    });
    if (duplicate) throw new Error(`El usuario ${idUsuario} ya posee el rol ${nombre}`);

    const created = await models.Rol.create(
      { nombre, id_usuario: idUsuario },
      { transaction }
    );

    return serialize(created);
  });
