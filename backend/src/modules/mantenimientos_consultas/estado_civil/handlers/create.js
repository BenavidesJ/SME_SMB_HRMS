import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireUppercaseString } from "../../shared/validators.js";

export const createEstadoCivil = (payload) =>
  runInTransaction(async (transaction) => {
    const estadoCivil = requireUppercaseString(payload.estado_civil, "estado_civil");

    const exists = await models.EstadoCivil.findOne({
      where: { estado_civil: estadoCivil },
      transaction,
    });
    if (exists) throw new Error(`Ya existe un estado civil ${estadoCivil}`);

    const created = await models.EstadoCivil.create(
      { estado_civil: estadoCivil },
      { transaction }
    );

    return { id: created.id_estado_civil, estado_civil: created.estado_civil };
  });
