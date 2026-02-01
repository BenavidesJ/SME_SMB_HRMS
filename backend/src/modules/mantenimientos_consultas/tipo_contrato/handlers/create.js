import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

export const createTipoContrato = (payload) =>
  runInTransaction(async (transaction) => {
    const id = requirePositiveInt(payload.id_tipo_contrato, "id_tipo_contrato");
    const tipoContrato = requireNonEmptyString(payload.tipo_contrato, "tipo_contrato");

    const existing = await models.TipoContrato.findByPk(id, { transaction });
    if (existing) throw new Error(`Ya existe tipo de contrato con id ${id}`);

    const duplicate = await models.TipoContrato.findOne({ where: { tipo_contrato: tipoContrato }, transaction });
    if (duplicate) throw new Error(`Ya existe tipo de contrato ${tipoContrato}`);

    const created = await models.TipoContrato.create(
      { id_tipo_contrato: id, tipo_contrato: tipoContrato },
      { transaction }
    );

    return { id: created.id_tipo_contrato, tipo_contrato: created.tipo_contrato };
  });
