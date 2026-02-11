import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { ensurePatchHasAllowedFields, requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

const serialize = (registro) => ({ id: registro.id_tipo_incap, nombre: registro.nombre });

export const updateTipoIncapacidad = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const iid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["nombre"]);

    const existing = await models.TipoIncapacidad.findByPk(iid, { transaction });
    if (!existing) throw new Error(`No existe tipo de incapacidad con id ${iid}`);

    const nombre = requireNonEmptyString(patch.nombre, "nombre");

    const duplicate = await models.TipoIncapacidad.findOne({
      where: { nombre, id_tipo_incap: { [Op.ne]: iid } },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un tipo de incapacidad ${nombre}`);

    await models.TipoIncapacidad.update(
      { nombre },
      { where: { id_tipo_incap: iid }, transaction }
    );

    const refreshed = await models.TipoIncapacidad.findByPk(iid, { transaction });
    return serialize(refreshed);
  });
