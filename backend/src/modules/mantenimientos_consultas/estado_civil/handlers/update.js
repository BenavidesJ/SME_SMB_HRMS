import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import {
  ensurePatchHasAllowedFields,
  requirePositiveInt,
  requireUppercaseString,
} from "../../shared/validators.js";

export const updateEstadoCivil = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const eid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["estado_civil"]);

    const estado = await models.EstadoCivil.findByPk(eid, { transaction });
    if (!estado) throw new Error(`No existe estado civil con id ${eid}`);

    const estadoCivil = requireUppercaseString(patch.estado_civil, "estado_civil");

    const duplicate = await models.EstadoCivil.findOne({
      where: {
        estado_civil: estadoCivil,
        id_estado_civil: { [Op.ne]: eid },
      },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un estado civil ${estadoCivil}`);

    await models.EstadoCivil.update(
      { estado_civil: estadoCivil },
      { where: { id_estado_civil: eid }, transaction }
    );

    const refreshed = await models.EstadoCivil.findByPk(eid, { transaction });
    return { id: refreshed.id_estado_civil, estado_civil: refreshed.estado_civil };
  });
