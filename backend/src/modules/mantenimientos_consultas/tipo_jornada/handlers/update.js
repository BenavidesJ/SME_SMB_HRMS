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
  id: registro.id_tipo_jornada,
  tipo: registro.tipo,
  max_horas_diarias: Number(registro.max_horas_diarias),
  max_horas_semanales: Number(registro.max_horas_semanales),
});

export const updateTipoJornada = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const jid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["tipo", "max_horas_diarias", "max_horas_semanales"]);

    const existing = await models.TipoJornada.findByPk(jid, { transaction });
    if (!existing) throw new Error(`No existe tipo de jornada con id ${jid}`);

    const tipoRaw = optionalString(patch.tipo, "tipo") ?? existing.tipo;
    const maxDiariasRaw = optionalDecimal(patch.max_horas_diarias, "max_horas_diarias", { min: 0 });
    const maxSemanalesRaw = optionalDecimal(patch.max_horas_semanales, "max_horas_semanales", { min: 0 });

    const tipo = requireNonEmptyString(tipoRaw, "tipo");
    const maxDiarias = maxDiariasRaw !== undefined
      ? requireDecimal(maxDiariasRaw, "max_horas_diarias", { min: 0 })
      : Number(existing.max_horas_diarias);
    const maxSemanales = maxSemanalesRaw !== undefined
      ? requireDecimal(maxSemanalesRaw, "max_horas_semanales", { min: 0 })
      : Number(existing.max_horas_semanales);

    const duplicate = await models.TipoJornada.findOne({
      where: {
        tipo,
        id_tipo_jornada: { [Op.ne]: jid },
      },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un tipo de jornada ${tipo}`);

    await models.TipoJornada.update(
      { tipo, max_horas_diarias: maxDiarias, max_horas_semanales: maxSemanales },
      { where: { id_tipo_jornada: jid }, transaction }
    );

    const refreshed = await models.TipoJornada.findByPk(jid, { transaction });
    return serialize(refreshed);
  });
