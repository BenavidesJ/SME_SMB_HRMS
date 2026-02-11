import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteEstadoCivil = ({ id }) =>
  runInTransaction(async (transaction) => {
    const eid = requirePositiveInt(id, "id");

    const deleted = await models.EstadoCivil.destroy({ where: { id_estado_civil: eid }, transaction });
    if (!deleted) throw new Error(`No existe estado civil con id ${eid}`);

    return { id: eid };
  });
