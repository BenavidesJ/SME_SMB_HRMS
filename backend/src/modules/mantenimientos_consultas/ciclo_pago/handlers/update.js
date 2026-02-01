import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { ensurePatchHasAllowedFields, requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

export const updateCicloPago = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const cid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["ciclo_pago"]);

    const ciclo = await models.CicloPago.findByPk(cid, { transaction });
    if (!ciclo) throw new Error(`No existe ciclo de pago con id ${cid}`);

    const cicloPago = requireNonEmptyString(patch.ciclo_pago, "ciclo_pago");

    await models.CicloPago.update(
      { ciclo_pago: cicloPago },
      { where: { id_ciclo_pago: cid }, transaction }
    );

    const refreshed = await models.CicloPago.findByPk(cid, { transaction });
    return { id: refreshed.id_ciclo_pago, ciclo_pago: refreshed.ciclo_pago };
  });
