import { SolicitudVacaciones } from "../../../models/index.js";
import { listarVacacionesPorColaborador } from "./listarVacacionesPorColaborador.js";

const PRIORIDAD_ESTADOS = { PENDIENTE: 0, RECHAZADO: 1, APROBADO: 2, CANCELADO: 3 };

const normalizeEstado = (value) => String(value ?? "").trim().toUpperCase();

const toTimestamp = (value) => {
  const parsed = new Date(String(value ?? "")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function listarVacaciones({ id_colaborador, estado, aprobador_filter } = {}) {
  let items = [];

  if (id_colaborador !== undefined && id_colaborador !== null && String(id_colaborador).trim() !== "") {
    items = await listarVacacionesPorColaborador({
      id_colaborador,
      aprobador_filter,
    });
  } else {
    const rows = await SolicitudVacaciones.findAll({
      attributes: ["id_colaborador"],
      ...(aprobador_filter ? { where: { id_aprobador: aprobador_filter } } : {}),
      group: ["id_colaborador"],
      order: [["id_colaborador", "ASC"]],
      raw: true,
    });

    for (const row of rows) {
      const collaboratorId = Number(row.id_colaborador);
      if (!Number.isInteger(collaboratorId) || collaboratorId <= 0) continue;

      const collaboratorItems = await listarVacacionesPorColaborador({
        id_colaborador: collaboratorId,
        aprobador_filter,
      });
      items.push(...collaboratorItems);
    }
  }

  const estadoFilter = normalizeEstado(estado);
  if (estadoFilter) {
    items = items.filter((item) => normalizeEstado(item.estadoSolicitudVacaciones?.estado) === estadoFilter);
  }

  return items.sort((left, right) => {
    const leftPriority = PRIORIDAD_ESTADOS[normalizeEstado(left.estadoSolicitudVacaciones?.estado)] ?? 99;
    const rightPriority = PRIORIDAD_ESTADOS[normalizeEstado(right.estadoSolicitudVacaciones?.estado)] ?? 99;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return toTimestamp(right.fecha_inicio) - toTimestamp(left.fecha_inicio);
  });
}