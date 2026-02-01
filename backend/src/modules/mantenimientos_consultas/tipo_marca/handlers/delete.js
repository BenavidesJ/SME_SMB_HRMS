import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteTipoMarca = ({ id }) =>
  runInTransaction(async (transaction) => {
    const mid = requirePositiveInt(id, "id");

    const deleted = await models.TipoMarca.destroy({ where: { id_tipo_marca: mid }, transaction });
    if (!deleted) throw new Error(`No existe tipo de marca con id ${mid}`);

    return { id: mid };
  });
