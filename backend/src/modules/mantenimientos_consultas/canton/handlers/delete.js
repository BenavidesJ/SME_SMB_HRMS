import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteCanton = ({ id }) =>
  runInTransaction(async (transaction) => {
    const cid = requirePositiveInt(id, "id");

    const deleted = await models.Canton.destroy({ where: { id_canton: cid }, transaction });
    if (!deleted) throw new Error(`No existe cantón con id ${cid}`);

    return { id: cid };
  });
