import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireDecimal, requireNonEmptyString } from "../../shared/validators.js";

const serialize = (registro) => ({
  id: registro.id_tipo_hx,
  nombre: registro.nombre,
  multiplicador: Number(registro.multiplicador),
});

export const createTipoHoraExtra = (payload) =>
  runInTransaction(async (transaction) => {
    const nombre = requireNonEmptyString(payload.nombre, "nombre");
    const multiplicador = requireDecimal(payload.multiplicador, "multiplicador", { min: 0 });

    const duplicate = await models.TipoHoraExtra.findOne({ where: { nombre }, transaction });
    if (duplicate) throw new Error(`Ya existe un tipo de hora extra ${nombre}`);

    const created = await models.TipoHoraExtra.create(
      { nombre, multiplicador },
      { transaction }
    );

    return serialize(created);
  });
