import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import {
  ensurePatchHasAllowedFields,
  optionalDecimal,
  optionalString,
  requireDecimal,
  requireNonEmptyString,
  requirePositiveInt,
} from "../../shared/validators.js";

const serialize = (registro) => ({
  id: registro.id_tipo_hx,
  nombre: registro.nombre,
  multiplicador: Number(registro.multiplicador),
});

export const updateTipoHoraExtra = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const hid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["nombre", "multiplicador"]);

    const existing = await models.TipoHoraExtra.findByPk(hid, { transaction });
    if (!existing) throw new Error(`No existe tipo de hora extra con id ${hid}`);

    const nombreRaw = optionalString(patch.nombre, "nombre") ?? existing.nombre;
    const multiplicadorRaw = optionalDecimal(patch.multiplicador, "multiplicador", { min: 0 });

    const nombre = requireNonEmptyString(nombreRaw, "nombre");
    const multiplicador = multiplicadorRaw !== undefined
      ? requireDecimal(multiplicadorRaw, "multiplicador", { min: 0 })
      : Number(existing.multiplicador);

    const duplicate = await models.TipoHoraExtra.findOne({
      where: {
        nombre,
        id_tipo_hx: { [Op.ne]: hid },
      },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un tipo de hora extra ${nombre}`);

    await models.TipoHoraExtra.update(
      { nombre, multiplicador },
      { where: { id_tipo_hx: hid }, transaction }
    );

    const refreshed = await models.TipoHoraExtra.findByPk(hid, { transaction });
    return serialize(refreshed);
  });
