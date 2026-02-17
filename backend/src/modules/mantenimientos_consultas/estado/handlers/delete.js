import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteEstado = ({ id }) =>
  runInTransaction(async (transaction) => {
    const eid = requirePositiveInt(id, "id");

    const deleted = await models.Estado.destroy({
      where: { id_estado: eid },
      transaction,
    });
    if (!deleted) throw new Error(`No existe estado con id ${eid}`);

    return { id: eid };
  });