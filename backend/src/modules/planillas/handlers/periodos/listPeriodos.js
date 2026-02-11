import { models } from "../../../../models/index.js";
import { serializePeriodo } from "../../shared/formatters.js";

const { PeriodoPlanilla, Estado } = models;

export const listPeriodosPlanilla = async () => {
  const periodos = await PeriodoPlanilla.findAll({
    include: [{ model: Estado, as: "estadoRef", attributes: ["estado"] }],
    order: [["fecha_inicio", "DESC"]],
  });
  return periodos.map(serializePeriodo);
};
