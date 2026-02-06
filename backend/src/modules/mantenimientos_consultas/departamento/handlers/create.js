import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString } from "../../shared/validators.js";

const serialize = (departamento) => ({ id: departamento.id_departamento, nombre: departamento.nombre });

export const createDepartamento = (payload) =>
  runInTransaction(async (transaction) => {
    const nombre = requireNonEmptyString(payload.nombre, "nombre");

    const duplicate = await models.Departamento.findOne({ where: { nombre }, transaction });
    if (duplicate) throw new Error(`Ya existe un departamento con nombre ${nombre}`);

    const created = await models.Departamento.create(
      { nombre },
      { transaction }
    );

    return serialize(created);
  });
