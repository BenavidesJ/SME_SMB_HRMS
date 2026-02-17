import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { ensurePatchHasAllowedFields, requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

export const updateCausaLiquidacion = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const cid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["causa_liquidacion"]);

    const causa = requireNonEmptyString(patch.causa_liquidacion, "causa_liquidacion");

    const duplicate = await models.CausaLiquidacion.findOne({
      where: {
        causa_liquidacion: causa,
        id_causa_liquidacion: { [Op.ne]: cid },
      },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe una causa de liquidación con descripción ${causa}`);

    const [updated] = await models.CausaLiquidacion.update(
      { causa_liquidacion: causa },
      { where: { id_causa_liquidacion: cid }, transaction }
    );
    if (!updated) throw new Error(`No existe causa de liquidación con id ${cid}`);

    const refreshed = await models.CausaLiquidacion.findByPk(cid, { transaction });
    return { id: refreshed.id_causa_liquidacion, causa_liquidacion: refreshed.causa_liquidacion };
  });
