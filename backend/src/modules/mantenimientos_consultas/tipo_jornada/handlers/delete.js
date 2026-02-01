import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteTipoJornada = ({ id }) =>
  runInTransaction(async (transaction) => {
    const jid = requirePositiveInt(id, "id");

    const deleted = await models.TipoJornada.destroy({ where: { id_tipo_jornada: jid }, transaction });
    if (!deleted) throw new Error(`No existe tipo de jornada con id ${jid}`);

    return { id: jid };
  });
