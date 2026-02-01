import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteRol = ({ id }) =>
  runInTransaction(async (transaction) => {
    const rid = requirePositiveInt(id, "id");

    const deleted = await models.Rol.destroy({ where: { id_rol: rid }, transaction });
    if (!deleted) throw new Error(`No existe rol con id ${rid}`);

    return { id: rid };
  });
