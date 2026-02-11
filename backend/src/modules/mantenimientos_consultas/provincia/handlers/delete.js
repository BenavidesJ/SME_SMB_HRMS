import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteProvincia = ({ id }) =>
  runInTransaction(async (transaction) => {
    const pid = requirePositiveInt(id, "id");

    const deleted = await models.Provincia.destroy({ where: { id_provincia: pid }, transaction });
    if (!deleted) throw new Error(`No existe provincia con id ${pid}`);

    return { id: pid };
  });
