import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString } from "../../shared/validators.js";

const serialize = (rol) => ({
  id: rol.id_rol,
  nombre: rol.nombre,
});

export const createRol = (payload) =>
  runInTransaction(async (transaction) => {
    const nombre = requireNonEmptyString(payload.nombre, "nombre");
    const duplicate = await models.Rol.findOne({
      where: { nombre },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un rol con nombre ${nombre}`);

    const created = await models.Rol.create(
      { nombre },
      { transaction }
    );

    return serialize(created);
  });
