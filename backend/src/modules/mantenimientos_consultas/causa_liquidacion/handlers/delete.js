import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteCausaLiquidacion = ({ id }) =>
  runInTransaction(async (transaction) => {
    const cid = requirePositiveInt(id, "id");

    const deleted = await models.CausaLiquidacion.destroy({
      where: { id_causa_liquidacion: cid },
      transaction,
    });
    if (!deleted) throw new Error(`No existe causa de liquidación con id ${cid}`);

    return { id: cid };
  });
