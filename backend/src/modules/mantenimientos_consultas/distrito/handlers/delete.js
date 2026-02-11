import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteDistrito = ({ id }) =>
  runInTransaction(async (transaction) => {
    const did = requirePositiveInt(id, "id");

    const deleted = await models.Distrito.destroy({ where: { id_distrito: did }, transaction });
    if (!deleted) throw new Error(`No existe distrito con id ${did}`);

    return { id: did };
  });
