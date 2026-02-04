import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString } from "../../shared/validators.js";

export const createTipoContrato = (payload) =>
  runInTransaction(async (transaction) => {
    const tipoContrato = requireNonEmptyString(payload.tipo_contrato, "tipo_contrato");

    const duplicate = await models.TipoContrato.findOne({ where: { tipo_contrato: tipoContrato }, transaction });
    if (duplicate) throw new Error(`Ya existe tipo de contrato ${tipoContrato}`);

    const created = await models.TipoContrato.create(
      { tipo_contrato: tipoContrato },
      { transaction }
    );

    return { id: created.id_tipo_contrato, tipo_contrato: created.tipo_contrato };
  });
