import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { ensurePatchHasAllowedFields, requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

const serialize = (departamento) => ({ id: departamento.id_departamento, nombre: departamento.nombre });

export const updateDepartamento = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const did = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["nombre"]);

    const departamento = await models.Departamento.findByPk(did, { transaction });
    if (!departamento) throw new Error(`No existe departamento con id ${did}`);

    const nombre = requireNonEmptyString(patch.nombre, "nombre");

    const duplicate = await models.Departamento.findOne({
      where: { nombre, id_departamento: { [Op.ne]: did } },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un departamento con nombre ${nombre}`);

    await models.Departamento.update(
      { nombre },
      { where: { id_departamento: did }, transaction }
    );

    const refreshed = await models.Departamento.findByPk(did, { transaction });
    return serialize(refreshed);
  });
