import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import {
  ensurePatchHasAllowedFields,
  requireNonEmptyString,
  requirePositiveInt,
} from "../../shared/validators.js";

export const updateProvincia = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const pid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["nombre"]);

    const provincia = await models.Provincia.findByPk(pid, { transaction });
    if (!provincia) throw new Error(`No existe provincia con id ${pid}`);

    const nombre = requireNonEmptyString(patch.nombre, "nombre");

    const duplicate = await models.Provincia.findOne({
      where: { nombre, id_provincia: { [Op.ne]: pid } },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe provincia con nombre ${nombre}`);

    await models.Provincia.update(
      { nombre },
      { where: { id_provincia: pid }, transaction }
    );

    const refreshed = await models.Provincia.findByPk(pid, { transaction });
    return { id: refreshed.id_provincia, nombre: refreshed.nombre };
  });
