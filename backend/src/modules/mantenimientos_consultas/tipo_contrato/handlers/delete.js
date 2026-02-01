import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteTipoContrato = ({ id }) =>
  runInTransaction(async (transaction) => {
    const tid = requirePositiveInt(id, "id");

    const deleted = await models.TipoContrato.destroy({ where: { id_tipo_contrato: tid }, transaction });
    if (!deleted) throw new Error(`No existe tipo de contrato con id ${tid}`);

    return { id: tid };
  });
