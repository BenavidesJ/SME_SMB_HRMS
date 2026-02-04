import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import { ensurePatchHasAllowedFields, requireNonEmptyString, requirePositiveInt, requireDecimal } from "../../shared/validators.js";

const serialize = (puesto) => ({
  id: puesto.id_puesto,
  puesto: puesto.nombre,
  departamento: puesto.departamento?.nombre,
  salario_ref_minimo: puesto.sal_base_referencia_min,
  salario_ref_maximo: puesto.sal_base_referencia_max,
  estado: puesto.estadoRef?.estado,
});

export const updatePuesto = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const pid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["nombre", "departamento", "sal_base_referencia_min", "sal_base_referencia_max"]);

    const puesto = await models.Puesto.findByPk(pid, { transaction });
    if (!puesto) throw new Error(`No existe puesto con id ${pid}`);

    const nombre = requireNonEmptyString(patch.nombre, "nombre");
    const departamentoNombre = requireNonEmptyString(patch.departamento, "departamento");
    const sal_min = requireDecimal(patch.sal_base_referencia_min, "sal_base_referencia_min", { min: 0 });
    const sal_max = requireDecimal(patch.sal_base_referencia_max, "sal_base_referencia_max", { min: 0 });

    if (sal_min > sal_max) {
      throw new Error("El salario mínimo no puede ser mayor al máximo");
    }

    const duplicate = await models.Puesto.findOne({
      where: { nombre, id_puesto: { [Op.ne]: pid } },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un puesto con nombre ${nombre}`);

    const departamento = await models.Departamento.findOne({
      where: { nombre: departamentoNombre },
      transaction,
    });
    if (!departamento) throw new Error(`No existe departamento con nombre ${departamentoNombre}`);

    await models.Puesto.update(
      {
        nombre,
        id_departamento: departamento.id_departamento,
        sal_base_referencia_min: sal_min,
        sal_base_referencia_max: sal_max,
      },
      { where: { id_puesto: pid }, transaction }
    );

    const refreshed = await models.Puesto.findByPk(pid, {
      include: [
        { model: models.Departamento, as: "departamento", attributes: ["nombre"] },
        { model: models.Estado, as: "estadoRef", attributes: ["estado"] },
      ],
      transaction,
    });
    return serialize(refreshed);
  });
