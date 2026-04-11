import { SolicitudPermisos } from "../../../models/index.js";
import { listarPermisosPorColaborador } from "./listarPermisosPorColaborador.js";

const PRIORIDAD_ESTADOS = { PENDIENTE: 0, RECHAZADO: 1, APROBADO: 2, CANCELADO: 3 };

const normalizeEstado = (value) => String(value ?? "").trim().toUpperCase();

const toTimestamp = (value) => {
  const parsed = new Date(String(value ?? "")).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function listarPermisos({ id_colaborador, estado, aprobador_filter } = {}) {
  let items = [];

  if (id_colaborador !== undefined && id_colaborador !== null && String(id_colaborador).trim() !== "") {
    items = await listarPermisosPorColaborador({
      id_colaborador,
      aprobador_filter,
    });
  } else {
    const rows = await SolicitudPermisos.findAll({
      attributes: ["id_colaborador"],
      ...(aprobador_filter ? { where: { id_aprobador: aprobador_filter } } : {}),
      group: ["id_colaborador"],
      order: [["id_colaborador", "ASC"]],
      raw: true,
    });

    for (const row of rows) {
      const collaboratorId = Number(row.id_colaborador);
      if (!Number.isInteger(collaboratorId) || collaboratorId <= 0) continue;

      const collaboratorItems = await listarPermisosPorColaborador({
        id_colaborador: collaboratorId,
        aprobador_filter,
      });
      items.push(...collaboratorItems);
    }
  }

  const estadoFilter = normalizeEstado(estado);
  if (estadoFilter) {
    items = items.filter((item) => normalizeEstado(item.estadoSolicitudPermisos?.estado ?? item.estado_solicitud) === estadoFilter);
  }

  return items.sort((left, right) => {
    const leftPriority = PRIORIDAD_ESTADOS[normalizeEstado(left.estadoSolicitudPermisos?.estado ?? left.estado_solicitud)] ?? 99;
    const rightPriority = PRIORIDAD_ESTADOS[normalizeEstado(right.estadoSolicitudPermisos?.estado ?? right.estado_solicitud)] ?? 99;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    return toTimestamp(right.fecha_inicio) - toTimestamp(left.fecha_inicio);
  });
}