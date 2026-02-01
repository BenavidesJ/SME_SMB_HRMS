import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { ensurePatchHasAllowedFields, requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

const serialize = (registro) => ({ id: registro.id_tipo_marca, nombre: registro.nombre });

export const updateTipoMarca = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const mid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["nombre"]);

    const existing = await models.TipoMarca.findByPk(mid, { transaction });
    if (!existing) throw new Error(`No existe tipo de marca con id ${mid}`);

    const nombre = requireNonEmptyString(patch.nombre, "nombre");

    const duplicate = await models.TipoMarca.findOne({
      where: { nombre, id_tipo_marca: { [Op.ne]: mid } },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un tipo de marca ${nombre}`);

    await models.TipoMarca.update(
      { nombre },
      { where: { id_tipo_marca: mid }, transaction }
    );

    const refreshed = await models.TipoMarca.findByPk(mid, { transaction });
    return serialize(refreshed);
  });
