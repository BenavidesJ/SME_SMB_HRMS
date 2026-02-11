import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteTipoHoraExtra = ({ id }) =>
  runInTransaction(async (transaction) => {
    const hid = requirePositiveInt(id, "id");

    const deleted = await models.TipoHoraExtra.destroy({ where: { id_tipo_hx: hid }, transaction });
    if (!deleted) throw new Error(`No existe tipo de hora extra con id ${hid}`);

    return { id: hid };
  });
