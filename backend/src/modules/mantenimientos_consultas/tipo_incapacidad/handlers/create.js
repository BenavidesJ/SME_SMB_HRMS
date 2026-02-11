import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString } from "../../shared/validators.js";

const serialize = (registro) => ({ id: registro.id_tipo_incap, nombre: registro.nombre });

export const createTipoIncapacidad = (payload) =>
  runInTransaction(async (transaction) => {
    const nombre = requireNonEmptyString(payload.nombre, "nombre");

    const duplicate = await models.TipoIncapacidad.findOne({ where: { nombre }, transaction });
    if (duplicate) throw new Error(`Ya existe un tipo de incapacidad ${nombre}`);

    const created = await models.TipoIncapacidad.create(
      { nombre },
      { transaction }
    );

    return serialize(created);
  });
