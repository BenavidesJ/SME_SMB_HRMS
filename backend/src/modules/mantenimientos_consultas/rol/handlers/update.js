import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import {
  ensurePatchHasAllowedFields,
  optionalString,
  requireNonEmptyString,
  requirePositiveInt,
} from "../../shared/validators.js";

const serialize = (rol) => ({ id: rol.id_rol, nombre: rol.nombre });

export const updateRol = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const rid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["nombre"]);

    const existing = await models.Rol.findByPk(rid, { transaction });
    if (!existing) throw new Error(`No existe rol con id ${rid}`);

    const nombreRaw = optionalString(patch.nombre, "nombre") ?? existing.nombre;

    const nombre = requireNonEmptyString(nombreRaw, "nombre");

    const duplicate = await models.Rol.findOne({
      where: {
        nombre,
        id_rol: { [Op.ne]: rid },
      },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un rol con nombre ${nombre}`);

    await models.Rol.update(
      { nombre },
      { where: { id_rol: rid }, transaction }
    );

    const refreshed = await models.Rol.findByPk(rid, { transaction });
    return serialize(refreshed);
  });
