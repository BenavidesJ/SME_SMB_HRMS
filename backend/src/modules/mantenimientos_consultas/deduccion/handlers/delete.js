import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteDeduccion = ({ id }) =>
  runInTransaction(async (transaction) => {
    const did = requirePositiveInt(id, "id");

    const deleted = await models.Deduccion.destroy({ where: { id_deduccion: did }, transaction });
    if (!deleted) throw new Error(`No existe deducción con id ${did}`);

    return { id: did };
  });
