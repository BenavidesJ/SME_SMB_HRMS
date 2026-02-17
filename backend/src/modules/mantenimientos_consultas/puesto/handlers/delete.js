import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deletePuesto = ({ id }) =>
  runInTransaction(async (transaction) => {
    const pid = requirePositiveInt(id, "id");

    const deleted = await models.Puesto.destroy({ where: { id_puesto: pid }, transaction });
    if (!deleted) throw new Error(`No existe puesto con id ${pid}`);

    return { id: pid };
  });
