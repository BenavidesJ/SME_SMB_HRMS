import { models, sequelize } from "../../../../models/index.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";

const { PeriodoPlanilla, Planilla } = models;

export const deletePeriodoPlanilla = async ({ id }) => {
  const periodoId = requirePositiveInt(id, "id");

  return sequelize.transaction(async (transaction) => {
    const planillas = await Planilla.count({ where: { id_periodo: periodoId }, transaction });
    if (planillas > 0) {
      throw new Error("No se puede eliminar el periodo porque tiene planillas generadas");
    }

    const deleted = await PeriodoPlanilla.destroy({ where: { id_periodo: periodoId }, transaction });
    if (!deleted) {
      throw new Error(`No existe un periodo de planilla con id ${periodoId}`);
    }

    return { id: periodoId };
  });
};
