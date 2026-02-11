import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString } from "../../shared/validators.js";

export const createCausaLiquidacion = (payload) =>
  runInTransaction(async (transaction) => {
    const causa = requireNonEmptyString(payload.causa_liquidacion, "causa_liquidacion");

    const exists = await models.CausaLiquidacion.findOne({
      where: { causa_liquidacion: causa },
      transaction,
    });
    if (exists) throw new Error(`Ya existe una causa de liquidación con descripción ${causa}`);

    const created = await models.CausaLiquidacion.create(
      { causa_liquidacion: causa },
      { transaction }
    );

    return { id: created.id_causa_liquidacion, causa_liquidacion: created.causa_liquidacion };
  });
