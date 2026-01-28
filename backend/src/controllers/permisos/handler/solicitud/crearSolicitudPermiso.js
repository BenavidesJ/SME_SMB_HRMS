import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import {
  sequelize,
  SolicitudPermisosLicencias,
  TipoSolicitud,
  Estado,
  Colaborador,
  Contrato,
  HorarioLaboral,
  Feriado,
  Incapacidad,
} from "../../../../models/index.js";
import { assertNoLeaveOverlapRange } from "../../../../services/scheduleEngine/leaveGuard.js";
import { assertNoIncapacityOverlapRange } from "../../../../services/scheduleEngine/incapacityGuard.js";
import { validateLeaveByDateRange } from "../../../../services/scheduleEngine/leavesByDateRange.js";
import { loadActiveContractAndTemplate, loadHolidaysMap } from "../../../../services/scheduleEngine/providers/sequelizeScheduleProvider.js";

// import { assertNoIncapacityOverlapRange } from "../../../services/scheduleEngine/incapacityGuard.js";
// import { assertNoLeaveOverlapRange } from "../../../services/scheduleEngine/leaveGuard.js"; // (el guard que acordamos)
// import { loadActiveContractAndTemplate, loadHolidaysMap } from "../../../services/scheduleEngine/sequelizeScheduleProvider.js";
// import { validateLeaveByDateRange } from "../../../services/scheduleEngine/leavesByDateRange.js";

dayjs.extend(utc);
dayjs.extend(timezone);

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function assertDate(value, fieldName) {
  const d = dayjs(value);
  if (!d.isValid()) throw new Error(`${fieldName} inválido`);
  return d;
}

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
  return estado.id_estado;
}

/**
 * Crea una SolicitudPermisosLicencias (siempre inicia PENDIENTE).
 *
 * payload:
 * {
 *   id_colaborador: number,
 *   id_aprobador: number,
 *   tipo_solicitud: number, // FK TipoSolicitud
 *   fecha_inicio: Date|string,
 *   fecha_fin: Date|string,
 *   con_goce_salarial: boolean,
 *   observaciones: string
 * }
 */
export const crearSolicitudPermisoLicencia = async ({
  id_colaborador,
  id_aprobador,
  tipo_solicitud,
  fecha_inicio,
  fecha_fin,
  con_goce_salarial,
  observaciones,
}) => {
  const tx = await sequelize.transaction();
  try {
    if (!Number.isFinite(Number(id_colaborador))) {
      throw new Error("id_colaborador es requerido y debe ser numérico");
    }
    if (!Number.isFinite(Number(id_aprobador))) {
      throw new Error("id_aprobador es requerido y debe ser numérico");
    }
    if (!Number.isFinite(Number(tipo_solicitud))) {
      throw new Error("tipo_solicitud es requerido y debe ser numérico");
    }
    if (typeof con_goce_salarial !== "boolean") {
      throw new Error("con_goce_salarial es requerido y debe ser boolean");
    }
    if (String(observaciones ?? "").trim() === "") {
      throw new Error("observaciones es requerido");
    }

    const start = assertDate(fecha_inicio, "fecha_inicio");
    const end = assertDate(fecha_fin, "fecha_fin");

    if (!end.isAfter(start)) {
      throw new Error("fecha_fin debe ser mayor que fecha_inicio");
    }

    const colaborador = await Colaborador.findByPk(Number(id_colaborador), {
      attributes: ["id_colaborador"],
      transaction: tx,
    });
    if (!colaborador) throw new Error("No existe el colaborador");

    const tipo = await TipoSolicitud.findByPk(Number(tipo_solicitud), {
      attributes: ["id_tipo_solicitud", "tipo_solicitud", "es_permiso", "es_licencia"],
      transaction: tx,
    });
    if (!tipo) throw new Error("No existe el tipo_solicitud indicado");

    const ESTADO_ACTIVO_ID = await resolveEstadoIdByName({ nombre: "ACTIVO", transaction: tx });

    const { template } = await loadActiveContractAndTemplate({
      idColaborador: Number(id_colaborador),
      models: { Contrato, HorarioLaboral },
      config: {
        contratoActivoIds: [ESTADO_ACTIVO_ID],
        horarioActivoIds: [ESTADO_ACTIVO_ID],
      },
    });

    const tz = template.timezone || "America/Costa_Rica";
    const startDateStr = start.tz(tz).format("YYYY-MM-DD");
    const endDateStr = end.tz(tz).format("YYYY-MM-DD");

    const holidaysMap = await loadHolidaysMap({
      startDate: startDateStr,
      endDate: endDateStr,
      models: { Feriado },
    });

    const todayDate = dayjs().tz(tz).format("YYYY-MM-DD");

    const leaveValidation = validateLeaveByDateRange({
      startDate: startDateStr,
      endDate: endDateStr,
      template,
      holidaysMap,
      todayDate,
    });

    if (!leaveValidation.allowed) {
      const msg = leaveValidation.violations?.[0]?.message || "Rango inválido para permiso/licencia";
      throw new Error(`VALIDACION_PERMISO: ${msg}`);
    }

    const effectiveDates = leaveValidation.effectiveDates || [];
    if (effectiveDates.length === 0) {
      throw new Error("VALIDACION_PERMISO: no hay días laborables efectivos en el rango");
    }

    await assertNoIncapacityOverlapRange({
      models: { Incapacidad },
      idColaborador: Number(id_colaborador),
      fecha_inicio: startDateStr,
      fecha_fin: endDateStr,
      transaction: tx,
    });

    await assertNoLeaveOverlapRange({
      models: { SolicitudPermisosLicencias, Estado },
      idColaborador: Number(id_colaborador),
      fecha_inicio: startDateStr,
      fecha_fin: endDateStr,
      transaction: tx,
    });

    const ESTADO_PENDIENTE_ID = await resolveEstadoIdByName({
      nombre: "PENDIENTE",
      transaction: tx,
    });

    const diffMinutes = end.diff(start, "minute");
    const hours = round2(diffMinutes / 60);
    const days = round2(effectiveDates.length);

    const row = await SolicitudPermisosLicencias.create(
      {
        id_colaborador: Number(id_colaborador),
        id_aprobador: Number(id_aprobador),
        estado_solicitud: Number(ESTADO_PENDIENTE_ID),
        tipo_solicitud: Number(tipo_solicitud),
        fecha_inicio: start.toDate(),
        fecha_fin: end.toDate(),
        con_goce_salarial: Boolean(con_goce_salarial),
        observaciones: String(observaciones).trim(),
        cantidad_horas: hours,
        cantidad_dias: days,
      },
      { transaction: tx }
    );

    await tx.commit();

    return {
      ...row.toJSON(),
      meta_engine: {
        startDateStr,
        endDateStr,
        effectiveDates,
        computed: { cantidad_horas: hours, cantidad_dias: days },
        tipo_solicitud_nombre: String(tipo.tipo_solicitud),
      },
    };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
