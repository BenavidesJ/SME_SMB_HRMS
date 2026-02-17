import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const deleteDepartamento = ({ id }) =>
  runInTransaction(async (transaction) => {
    const did = requirePositiveInt(id, "id");

    const deleted = await models.Departamento.destroy({ where: { id_departamento: did }, transaction });
    if (!deleted) throw new Error(`No existe departamento con id ${did}`);

    return { id: did };
  });
