import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { ensurePatchHasAllowedFields, requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

export const updateTipoContrato = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const tid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["tipo_contrato"]);

    const existing = await models.TipoContrato.findByPk(tid, { transaction });
    if (!existing) throw new Error(`No existe tipo de contrato con id ${tid}`);

    const tipoContrato = requireNonEmptyString(patch.tipo_contrato, "tipo_contrato");

    const duplicate = await models.TipoContrato.findOne({
      where: { tipo_contrato: tipoContrato, id_tipo_contrato: { [Op.ne]: tid } },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe tipo de contrato ${tipoContrato}`);

    await models.TipoContrato.update(
      { tipo_contrato: tipoContrato },
      { where: { id_tipo_contrato: tid }, transaction }
    );

    const refreshed = await models.TipoContrato.findByPk(tid, { transaction });
    return { id: refreshed.id_tipo_contrato, tipo_contrato: refreshed.tipo_contrato };
  });
