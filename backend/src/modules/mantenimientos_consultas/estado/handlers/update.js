import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import {
  ensurePatchHasAllowedFields,
  requirePositiveInt,
  requireUppercaseString,
} from "../../shared/validators.js";

export const updateEstado = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const eid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["estado"]);

    const estado = requireUppercaseString(patch.estado, "estado");

    const dup = await models.Estado.findOne({
      where: { estado, id_estado: { [Op.ne]: eid } },
      transaction,
    });
    if (dup) throw new Error(`Ya existe un estado: ${estado}`);

    const [updated] = await models.Estado.update(
      { estado },
      { where: { id_estado: eid }, transaction }
    );
    if (!updated) throw new Error(`No existe estado con id ${eid}`);

    const refreshed = await models.Estado.findByPk(eid, { transaction });
    return { id: refreshed.id_estado, estado: refreshed.estado };
  });