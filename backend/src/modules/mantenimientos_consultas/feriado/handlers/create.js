import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireBoolean, requireDateOnly, requireNonEmptyString } from "../../shared/validators.js";

const serialize = (feriado) => ({
  id: feriado.id_feriado,
  fecha: feriado.fecha,
  nombre: feriado.nombre,
  es_obligatorio: Boolean(feriado.es_obligatorio),
});

export const createFeriado = (payload) =>
  runInTransaction(async (transaction) => {
    const fecha = requireDateOnly(payload.fecha, "fecha");
    const nombre = requireNonEmptyString(payload.nombre, "nombre");
    const esObligatorio = requireBoolean(payload.es_obligatorio, "es_obligatorio");

    const duplicate = await models.Feriado.findOne({ where: { fecha }, transaction });
    if (duplicate) throw new Error(`Ya existe un feriado registrado para la fecha ${fecha}`);

    const created = await models.Feriado.create(
      { fecha, nombre, es_obligatorio: esObligatorio },
      { transaction }
    );

    return serialize(created);
  });
