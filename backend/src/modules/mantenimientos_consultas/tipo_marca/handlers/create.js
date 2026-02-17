import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString } from "../../shared/validators.js";

const serialize = (registro) => ({ id: registro.id_tipo_marca, nombre: registro.nombre });

export const createTipoMarca = (payload) =>
  runInTransaction(async (transaction) => {
    const nombre = requireNonEmptyString(payload.nombre, "nombre");

    const duplicate = await models.TipoMarca.findOne({ where: { nombre }, transaction });
    if (duplicate) throw new Error(`Ya existe un tipo de marca ${nombre}`);

    const created = await models.TipoMarca.create(
      { nombre },
      { transaction }
    );

    return serialize(created);
  });
