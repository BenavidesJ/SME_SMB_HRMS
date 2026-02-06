import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import { serializePeriodo } from "../../shared/formatters.js";

const { PeriodoPlanilla, Estado } = models;

export const getPeriodoPlanilla = async ({ id }) => {
  const periodoId = requirePositiveInt(id, "id");
  const periodo = await PeriodoPlanilla.findByPk(periodoId, {
    include: [{ model: Estado, as: "estadoRef", attributes: ["estado"] }],
  });
  if (!periodo) throw new Error(`No existe un periodo de planilla con id ${periodoId}`);
  return serializePeriodo(periodo);
};
