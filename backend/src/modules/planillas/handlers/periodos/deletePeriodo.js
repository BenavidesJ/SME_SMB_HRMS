import { models, sequelize } from "../../../../models/index.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";

const { PeriodoPlanilla, Planilla, DeduccionPlanilla } = models;

export const deletePeriodoPlanilla = async ({ id }) => {
  const periodoId = requirePositiveInt(id, "id");

  return sequelize.transaction(async (transaction) => {
    const periodo = await PeriodoPlanilla.findByPk(periodoId, { transaction });
    if (!periodo) {
      throw new Error(`No existe un periodo de planilla con id ${periodoId}`);
    }

    const planillas = await Planilla.findAll({
      attributes: ["id_detalle"],
      where: { id_periodo: periodoId },
      transaction,
      raw: true,
    });

    const planillaIds = planillas
      .map((planilla) => Number(planilla.id_detalle))
      .filter((planillaId) => Number.isInteger(planillaId) && planillaId > 0);

    if (planillaIds.length > 0) {
      await DeduccionPlanilla.destroy({
        where: { id_planilla: planillaIds },
        transaction,
      });

      await Planilla.destroy({
        where: { id_detalle: planillaIds },
        transaction,
      });
    }

    await periodo.destroy({ transaction });

    return { id: periodoId };
  });
};
