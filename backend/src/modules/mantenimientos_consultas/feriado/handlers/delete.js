import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteFeriado = ({ id }) =>
  runInTransaction(async (transaction) => {
    const fid = requirePositiveInt(id, "id");

    const deleted = await models.Feriado.destroy({ where: { id_feriado: fid }, transaction });
    if (!deleted) throw new Error(`No existe feriado con id ${fid}`);

    return { id: fid };
  });
