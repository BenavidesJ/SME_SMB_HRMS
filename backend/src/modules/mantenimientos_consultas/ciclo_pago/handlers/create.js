import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

export const createCicloPago = (payload) =>
  runInTransaction(async (transaction) => {
    const id = requirePositiveInt(payload.id_ciclo_pago, "id_ciclo_pago");
    const cicloPago = requireNonEmptyString(payload.ciclo_pago, "ciclo_pago");

    const exists = await models.CicloPago.findByPk(id, { transaction });
    if (exists) throw new Error(`Ya existe un ciclo de pago con id ${id}`);

    const created = await models.CicloPago.create(
      { id_ciclo_pago: id, ciclo_pago: cicloPago },
      { transaction }
    );

    return { id: created.id_ciclo_pago, ciclo_pago: created.ciclo_pago };
  });
