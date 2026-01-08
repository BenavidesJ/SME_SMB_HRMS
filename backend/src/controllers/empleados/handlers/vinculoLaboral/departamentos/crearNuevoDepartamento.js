import { sequelize, Departamento } from "../../../../../models/index.js";

export const crearNuevoDepartamento = async ({ nombre }) => {
  const tx = await sequelize.transaction();
  try {
    const departmentValue = String(nombre ?? "").trim().toUpperCase();
    if (!departmentValue) throw new Error("El nombre del departamento es obligatorio");

    const exists = await Departamento.findOne({
      where: { nombre: departmentValue },
      transaction: tx,
    });
    if (exists) throw new Error(`Ya existe un departamento: ${departmentValue}`);

    const newDepartment = await Departamento.create(
      { nombre: departmentValue },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id: newDepartment.id_departamento,
      departamento: newDepartment.nombre,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
