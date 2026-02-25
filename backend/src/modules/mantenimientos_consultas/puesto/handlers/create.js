import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { requireNonEmptyString, requireDecimal } from "../../shared/validators.js";

const serialize = (puesto) => ({
  id: puesto.id_puesto,
  puesto: puesto.nombre,
  departamento: puesto.departamento?.nombre,
  salario_ref_minimo: puesto.sal_base_referencia_min,
  salario_ref_maximo: puesto.sal_base_referencia_max,
  estado: puesto.estadoRef?.estado,
});

export const createPuesto = (payload) =>
  runInTransaction(async (transaction) => {
    const nombre = requireNonEmptyString(payload.nombre, "nombre");
    const departamentoNombre = requireNonEmptyString(payload.departamento, "departamento");

    const duplicate = await models.Puesto.findOne({ where: { nombre }, transaction });
    if (duplicate) throw new Error(`Ya existe un puesto con nombre ${nombre}`);

    const departamento = await models.Departamento.findOne({
      where: { nombre: departamentoNombre },
      transaction,
    });
    if (!departamento) throw new Error(`No existe departamento con nombre ${departamentoNombre}`);

    const estadoActivo = await models.Estado.findOne({
      where: { estado: "ACTIVO" },
      transaction,
    });
    if (!estadoActivo) throw new Error("No se encontró el estado ACTIVO");

    const created = await models.Puesto.create(
      {
        nombre,
        id_departamento: departamento.id_departamento,
        estado: estadoActivo.id_estado,
      },
      { transaction }
    );

    const refreshed = await models.Puesto.findByPk(created.id_puesto, {
      include: [
        { model: models.Departamento, as: "departamento", attributes: ["nombre"] },
        { model: models.Estado, as: "estadoRef", attributes: ["estado"] },
      ],
      transaction,
    });

    return serialize(refreshed);
  });
