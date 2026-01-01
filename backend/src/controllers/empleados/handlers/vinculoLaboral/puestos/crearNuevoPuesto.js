
import { normalizeDecimal } from "../../../../../common/normalizeDecimal.js";
import { sequelize, Departamento, Puesto, Estado } from "../../../../../models/index.js";

export const crearNuevoPuesto = async ({
  nombre,
  departamento,
  sal_base_referencia_min,
  sal_base_referencia_max,
}) => {
  const tx = await sequelize.transaction();

  try {
    const nombreValue = String(nombre ?? "").trim().toUpperCase();
    const deptoValue = String(departamento ?? "").trim().toUpperCase();

    if (!nombreValue) throw new Error("El nombre del puesto es requerido.");
    if (!deptoValue) throw new Error("El departamento es requerido.");

    const min = normalizeDecimal(
      sal_base_referencia_min,
      { precision: 12, scale: 2, fieldName: "sal_base_referencia_min" }
    )

    const max = normalizeDecimal(
      sal_base_referencia_max,
      { precision: 12, scale: 2, fieldName: "sal_base_referencia_max" }
    )

    if (Number(min) > Number(max)) {
      throw new Error("El salario mínimo no puede ser mayor que el salario máximo.");
    }

    const exists = await Puesto.findOne({
      where: { nombre: nombreValue },
      transaction: tx,
    });
    if (exists) throw new Error(`Ya existe un puesto: ${nombreValue}`);

    const depto = await Departamento.findOne({
      where: { nombre: deptoValue },
      transaction: tx,
    });
    if (!depto) throw new Error(`No existe un departamento: ${deptoValue}`);

    const created = await Puesto.create(
      {
        nombre: nombreValue,
        id_departamento: depto.id_departamento,
        sal_base_referencia_min: min,
        sal_base_referencia_max: max,
        estado: 1,
      },
      { transaction: tx }
    );

    const createdFull = await Puesto.findByPk(created.id_puesto, {
      transaction: tx,
      attributes: ["id_puesto", "nombre", "sal_base_referencia_min", "sal_base_referencia_max"],
      include: [
        { model: Departamento, as: "departamentoPuesto", attributes: ["nombre"] },
        { model: Estado, as: "estadoPuesto", attributes: ["estado"] },
      ],
    });

    await tx.commit();

    return {
      id: createdFull.id_puesto,
      departamento: createdFull.departamentoPuesto?.nombre ?? "",
      puesto: createdFull.nombre,
      salario_ref_minimo: createdFull.sal_base_referencia_min,
      salario_ref_maximo: createdFull.sal_base_referencia_max,
      estado: createdFull.estadoPuesto?.estado ?? "",
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
