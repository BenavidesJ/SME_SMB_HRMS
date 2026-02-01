import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import {
  ensurePatchHasAllowedFields,
  optionalBoolean,
  optionalDateOnly,
  optionalString,
  requireBoolean,
  requireDateOnly,
  requireNonEmptyString,
  requirePositiveInt,
} from "../../shared/validators.js";

const serialize = (feriado) => ({
  id: feriado.id_feriado,
  fecha: feriado.fecha,
  nombre: feriado.nombre,
  es_obligatorio: Boolean(feriado.es_obligatorio),
});

export const updateFeriado = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const fid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["fecha", "nombre", "es_obligatorio"]);

    const existing = await models.Feriado.findByPk(fid, { transaction });
    if (!existing) throw new Error(`No existe feriado con id ${fid}`);

    const fechaRaw = optionalDateOnly(patch.fecha, "fecha") ?? existing.fecha;
    const nombreRaw = optionalString(patch.nombre, "nombre") ?? existing.nombre;
    const esObligatorioRaw = optionalBoolean(patch.es_obligatorio, "es_obligatorio");

    const fecha = requireDateOnly(fechaRaw, "fecha");
    const nombre = requireNonEmptyString(nombreRaw, "nombre");
    const esObligatorio = esObligatorioRaw !== undefined
      ? requireBoolean(esObligatorioRaw, "es_obligatorio")
      : Boolean(existing.es_obligatorio);

    const duplicate = await models.Feriado.findOne({
      where: {
        fecha,
        id_feriado: { [Op.ne]: fid },
      },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un feriado registrado para la fecha ${fecha}`);

    await models.Feriado.update(
      { fecha, nombre, es_obligatorio: esObligatorio },
      { where: { id_feriado: fid }, transaction }
    );

    const refreshed = await models.Feriado.findByPk(fid, { transaction });
    return serialize(refreshed);
  });
