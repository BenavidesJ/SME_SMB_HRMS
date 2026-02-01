import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireDecimal, requireNonEmptyString } from "../../shared/validators.js";

const serialize = (registro) => ({
  id: registro.id_tipo_jornada,
  tipo: registro.tipo,
  max_horas_diarias: Number(registro.max_horas_diarias),
  max_horas_semanales: Number(registro.max_horas_semanales),
});

export const createTipoJornada = (payload) =>
  runInTransaction(async (transaction) => {
    const tipo = requireNonEmptyString(payload.tipo, "tipo");
    const maxDiarias = requireDecimal(payload.max_horas_diarias, "max_horas_diarias", { min: 0 });
    const maxSemanales = requireDecimal(payload.max_horas_semanales, "max_horas_semanales", { min: 0 });

    const duplicate = await models.TipoJornada.findOne({ where: { tipo }, transaction });
    if (duplicate) throw new Error(`Ya existe un tipo de jornada ${tipo}`);

    const created = await models.TipoJornada.create(
      { tipo, max_horas_diarias: maxDiarias, max_horas_semanales: maxSemanales },
      { transaction }
    );

    return serialize(created);
  });
