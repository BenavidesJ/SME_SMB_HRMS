import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString, requirePositiveInt } from "../../shared/validators.js";

export const createProvincia = (payload) =>
  runInTransaction(async (transaction) => {
    const id = requirePositiveInt(payload.id_provincia, "id_provincia");
    const nombre = requireNonEmptyString(payload.nombre, "nombre");

    const existing = await models.Provincia.findByPk(id, { transaction });
    if (existing) throw new Error(`Ya existe provincia con id ${id}`);

    const duplicateName = await models.Provincia.findOne({ where: { nombre }, transaction });
    if (duplicateName) throw new Error(`Ya existe provincia con nombre ${nombre}`);

    const created = await models.Provincia.create(
      { id_provincia: id, nombre },
      { transaction }
    );

    return { id: created.id_provincia, nombre: created.nombre };
  });
