import { Op } from "sequelize";
import { Incapacidad, TipoIncapacidad } from "../../../../models/index.js";
import { mapIncapacitiesToCalendarEvents } from "../../../../services/scheduleEngine/providers/sequelizeIncapacityProvider.js";

export const obtenerIncapacidadesPorRango = async ({ fromDateStr, toDateStr }) => {
  if (!fromDateStr || !toDateStr) {
    throw new Error("fromDateStr y toDateStr son requeridos (YYYY-MM-DD)");
  }

  const rows = await Incapacidad.findAll({
    where: {
      fecha_inicio: { [Op.lte]: toDateStr },
      fecha_fin: { [Op.gte]: fromDateStr },
    },
    include: [
      {
        model: TipoIncapacidad,
        as: "tipoIncapacidad",
        attributes: ["id_tipo_incap", "nombre"],
        required: false,
      },
    ],
    order: [["fecha_inicio", "ASC"]],
  });

  return {
    rows,
    events: mapIncapacitiesToCalendarEvents(rows),
  };
};
