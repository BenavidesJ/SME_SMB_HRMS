import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireBoolean, requireDecimal, requireNonEmptyString } from "../../shared/validators.js";

export const createDeduccion = (payload) =>
  runInTransaction(async (transaction) => {
    const nombre = requireNonEmptyString(payload.nombre, "nombre");
    const valor = requireDecimal(payload.valor, "valor", { min: 0 });
    const esVoluntaria = requireBoolean(payload.es_voluntaria, "es_voluntaria");

    const duplicate = await models.Deduccion.findOne({
      where: { nombre },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe una deducción con nombre ${nombre}`);

    const created = await models.Deduccion.create(
      { nombre, valor, es_voluntaria: esVoluntaria },
      { transaction }
    );

    return {
      id: created.id_deduccion,
      nombre: created.nombre,
      valor: Number(created.valor),
      es_voluntaria: Boolean(created.es_voluntaria),
    };
  });
