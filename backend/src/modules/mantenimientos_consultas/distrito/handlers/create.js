import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

export const createDistrito = (payload) =>
  runInTransaction(async (transaction) => {
    const id = requirePositiveInt(payload.id_distrito, "id_distrito");
    const idCanton = requirePositiveInt(payload.id_canton, "id_canton");
    const nombre = requireNonEmptyString(payload.nombre, "nombre");

    const exists = await models.Distrito.findByPk(id, { transaction });
    if (exists) throw new Error(`Ya existe un distrito con id ${id}`);

    const canton = await models.Canton.findByPk(idCanton, { transaction });
    if (!canton) throw new Error(`No existe cantón con id ${idCanton}`);

    const duplicate = await models.Distrito.findOne({
      where: { id_canton: idCanton, nombre },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un distrito ${nombre} en el cantón ${idCanton}`);

    const created = await models.Distrito.create(
      { id_distrito: id, id_canton: idCanton, nombre },
      { transaction }
    );

    return { id: created.id_distrito, id_canton: created.id_canton, nombre: created.nombre };
  });
