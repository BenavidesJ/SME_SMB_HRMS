import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteTipoIncapacidad = ({ id }) =>
  runInTransaction(async (transaction) => {
    const iid = requirePositiveInt(id, "id");

    const deleted = await models.TipoIncapacidad.destroy({ where: { id_tipo_incap: iid }, transaction });
    if (!deleted) throw new Error(`No existe tipo de incapacidad con id ${iid}`);

    return { id: iid };
  });
