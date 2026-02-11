import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireUppercaseString } from "../../shared/validators.js";

export const createEstado = (payload) =>
  runInTransaction(async (transaction) => {
    const estado = requireUppercaseString(payload.estado, "estado");
    const exists = await models.Estado.findOne({ where: { estado }, transaction });
    if (exists) throw new Error(`Ya existe un estado: ${estado}`);
    const created = await models.Estado.create({ estado }, { transaction });
    return { id: created.id_estado, estado: created.estado };
  });