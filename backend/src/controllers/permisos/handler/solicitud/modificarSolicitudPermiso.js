import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import {
  sequelize,
  SolicitudPermisosLicencias,
  Estado,
  Incapacidad,
} from "../../../../models/index.js";
import { assertNoIncapacityOverlapRange } from "../../../../services/scheduleEngine/incapacityGuard.js";
import { assertNoLeaveOverlapRange } from "../../../../services/scheduleEngine/leaveGuard.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const ALLOWED_NEXT = new Set(["APROBADO", "RECHAZADO", "CANCELADO"]);

async function resolveEstadoIdByName({ nombre, transaction }) {
  const estado = await Estado.findOne({
    where: sequelize.where(
      sequelize.fn("UPPER", sequelize.col("estado")),
      String(nombre).trim().toUpperCase()
    ),
    attributes: ["id_estado", "estado"],
    transaction,
  });

  if (!estado) throw new Error(`No existe el estado "${nombre}" en el catálogo estado`);
  return { id: estado.id_estado, nombre: String(estado.estado).toUpperCase() };
}

function normalizeEstadoName(value) {
  return String(value ?? "").trim().toUpperCase();
}

function assertDate(value, fieldName) {
  const d = dayjs(value);
  if (!d.isValid()) throw new Error(`${fieldName} inválido`);
  return d;
}

/**
 * Cambia el estado de una solicitud de permiso/licencia.
 *
 * @param {Object} params
 * @param {number} params.id_solicitud
 * @param {string} params.nuevo_estado - "APROBADO"|"RECHAZADO"|"CANCELADO"
 * @param {string} [params.observaciones] - opcional: comentario del admin
 * @param {number} [params.id_aprobador] - opcional: para setear/quitar aprobador
 */
export const cambiarEstadoPermisoLicencia = async ({
  id_solicitud,
  nuevo_estado,
  observaciones,
  id_aprobador,
}) => {
  const tx = await sequelize.transaction();
  try {
    if (!Number.isFinite(Number(id_solicitud))) {
      throw new Error("id_solicitud inválido");
    }

    const nextName = normalizeEstadoName(nuevo_estado);
    if (!ALLOWED_NEXT.has(nextName)) {
      throw new Error(`nuevo_estado inválido. Permitidos: ${Array.from(ALLOWED_NEXT).join(", ")}`);
    }

    const row = await SolicitudPermisosLicencias.findByPk(Number(id_solicitud), {
      transaction: tx,
    });
    if (!row) throw new Error("No existe la solicitud");

    const currentEstadoRow = await Estado.findByPk(Number(row.estado_solicitud), {
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });
    if (!currentEstadoRow) throw new Error("Estado actual no existe en catálogo");

    const currentName = normalizeEstadoName(currentEstadoRow.estado);
    const { id: nextEstadoId } = await resolveEstadoIdByName({
      nombre: nextName,
      transaction: tx,
    });

    if (currentName === nextName) {
      return row; // idempotente
    }

    if (currentName === "CANCELADO") {
      throw new Error("TRANSICION_INVALIDA: una solicitud cancelada no puede modificarse");
    }
    if (currentName === "RECHAZADO") {
      throw new Error("TRANSICION_INVALIDA: una solicitud rechazada no puede modificarse");
    }
    if (currentName === "APROBADO") {
      throw new Error("TRANSICION_INVALIDA: una solicitud aprobada no puede modificarse");
    }

    // Si se va a aprobar: validar que aún no choque con incapacidad ni con otros permisos/licencias
    if (nextName === "APROBADO") {
      const start = assertDate(row.fecha_inicio, "fecha_inicio");
      const end = assertDate(row.fecha_fin, "fecha_fin");
      
      // Bloqueo por incapacidad (por rango día)
      const tz = "America/Costa_Rica";
      const startDateStr = start.tz(tz).format("YYYY-MM-DD");
      const endDateStr = end.tz(tz).format("YYYY-MM-DD");
      
      await assertNoIncapacityOverlapRange({
        models: { Incapacidad },
        idColaborador: Number(row.id_colaborador),
        fecha_inicio: startDateStr,
        fecha_fin: endDateStr,
        transaction: tx,
      });

      // Bloqueo por traslape con otras solicitudes (PENDIENTE/APROBADO)
      await assertNoLeaveOverlapRange({
        models: { SolicitudPermisosLicencias, Estado },
        idColaborador: Number(row.id_colaborador),
        fecha_inicio: start.toDate(),
        fecha_fin: end.toDate(),
        excludeId: Number(row.id_solicitud ?? id_solicitud),
        transaction: tx,
      });
    }

    const patch = {
      estado_solicitud: Number(nextEstadoId),
    };

    if (id_aprobador !== undefined) {
      if (!Number.isFinite(Number(id_aprobador))) {
        throw new Error("id_aprobador inválido");
      }
      patch.id_aprobador = Number(id_aprobador);
    }

    if (observaciones !== undefined) {
      patch.observaciones = String(observaciones || "N/A");
    }

    await row.update(patch, { transaction: tx });

    await tx.commit();
    return row;
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
