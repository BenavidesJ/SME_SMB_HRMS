import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import {
  ensurePatchHasAllowedFields,
  optionalPositiveInt,
  optionalString,
  requireNonEmptyString,
  requirePositiveInt,
} from "../../shared/validators.js";

const serialize = (rol) => ({ id: rol.id_rol, nombre: rol.nombre, id_usuario: rol.id_usuario });

export const updateRol = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const rid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["nombre", "id_usuario"]);

    const existing = await models.Rol.findByPk(rid, { transaction });
    if (!existing) throw new Error(`No existe rol con id ${rid}`);

    const nombreRaw = optionalString(patch.nombre, "nombre") ?? existing.nombre;
    const idUsuarioRaw = optionalPositiveInt(patch.id_usuario, "id_usuario") ?? existing.id_usuario;

    const nombre = requireNonEmptyString(nombreRaw, "nombre");
    const idUsuario = requirePositiveInt(idUsuarioRaw, "id_usuario");

    const usuario = await models.Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) throw new Error(`No existe usuario con id ${idUsuario}`);

    const duplicate = await models.Rol.findOne({
      where: {
        id_usuario: idUsuario,
        nombre,
        id_rol: { [Op.ne]: rid },
      },
      transaction,
    });
    if (duplicate) throw new Error(`El usuario ${idUsuario} ya posee el rol ${nombre}`);

    await models.Rol.update(
      { nombre, id_usuario: idUsuario },
      { where: { id_rol: rid }, transaction }
    );

    const refreshed = await models.Rol.findByPk(rid, { transaction });
    return serialize(refreshed);
  });
