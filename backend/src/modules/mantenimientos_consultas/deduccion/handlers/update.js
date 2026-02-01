import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import {
  ensurePatchHasAllowedFields,
  optionalBoolean,
  optionalDecimal,
  optionalString,
  requireNonEmptyString,
  requirePositiveInt,
} from "../../shared/validators.js";

export const updateDeduccion = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const did = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["nombre", "valor", "es_voluntaria"]);

    const deduccion = await models.Deduccion.findByPk(did, { transaction });
    if (!deduccion) throw new Error(`No existe deducción con id ${did}`);

    const nombre = optionalString(patch.nombre, "nombre") ?? deduccion.nombre;
    const valorRaw = optionalDecimal(patch.valor, "valor", { min: 0 });
    const esVoluntariaRaw = optionalBoolean(patch.es_voluntaria, "es_voluntaria");

    const nombreValidado = requireNonEmptyString(nombre, "nombre");
    const valor = valorRaw !== undefined ? valorRaw : Number(deduccion.valor);
    const esVoluntaria = esVoluntariaRaw !== undefined ? Boolean(esVoluntariaRaw) : Boolean(deduccion.es_voluntaria);

    const duplicate = await models.Deduccion.findOne({
      where: { nombre: nombreValidado, id_deduccion: { [Op.ne]: did } },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe una deducción con nombre ${nombreValidado}`);

    await models.Deduccion.update(
      { nombre: nombreValidado, valor, es_voluntaria: esVoluntaria },
      { where: { id_deduccion: did }, transaction }
    );

    const refreshed = await models.Deduccion.findByPk(did, { transaction });
    return {
      id: refreshed.id_deduccion,
      nombre: refreshed.nombre,
      valor: Number(refreshed.valor),
      es_voluntaria: Boolean(refreshed.es_voluntaria),
    };
  });
