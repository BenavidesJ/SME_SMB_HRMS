import { Incapacidad, TipoIncapacidad } from "../../../../models/index.js";
import {
  loadIncapacityBlocksByDateRange,
  mapIncapacitiesToCalendarEvents,
} from "../../../../services/scheduleEngine/sequelizeIncapacityProvider.js";

export const obtenerIncapacidadesPorColaborador = async ({
  id_colaborador,
  fromDateStr,
  toDateStr,
}) => {
  if (!Number.isFinite(Number(id_colaborador))) {
    throw new Error("id_colaborador es requerido y debe ser numérico");
  }

  const from = fromDateStr ?? "1900-01-01";
  const to = toDateStr ?? "2999-12-31";

  const rows = await loadIncapacityBlocksByDateRange({
    models: { Incapacidad, TipoIncapacidad },
    idColaborador: Number(id_colaborador),
    fromDateStr: from,
    toDateStr: to,
    transaction: null,
  });

  return {
    rows,
    events: mapIncapacitiesToCalendarEvents(rows),
  };
};
