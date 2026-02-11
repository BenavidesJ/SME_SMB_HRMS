import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteCicloPago = ({ id }) =>
  runInTransaction(async (transaction) => {
    const cid = requirePositiveInt(id, "id");

    const deleted = await models.CicloPago.destroy({ where: { id_ciclo_pago: cid }, transaction });
    if (!deleted) throw new Error(`No existe ciclo de pago con id ${cid}`);

    return { id: cid };
  });
