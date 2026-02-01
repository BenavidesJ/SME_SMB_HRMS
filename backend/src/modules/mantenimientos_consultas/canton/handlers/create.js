import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

export const createCanton = (payload) =>
  runInTransaction(async (transaction) => {
    const idProvincia = requirePositiveInt(payload.id_provincia, "id_provincia");
    const nombre = requireNonEmptyString(payload.nombre, "nombre");

    const provincia = await models.Provincia.findByPk(idProvincia, { transaction });
    if (!provincia) throw new Error(`No existe provincia con id ${idProvincia}`);

    const exists = await models.Canton.findOne({
      where: { id_provincia: idProvincia, nombre },
      transaction,
    });
    if (exists) throw new Error(`Ya existe un cantón ${nombre} en la provincia ${idProvincia}`);

    const created = await models.Canton.create(
      { id_provincia: idProvincia, nombre },
      { transaction }
    );

    return { id: created.id_canton, id_provincia: created.id_provincia, nombre: created.nombre };
  });
