import { Op } from "sequelize";
import {
  sequelize,
  Colaborador,
  Contrato,
  HorarioLaboral,
  JornadaDiaria,
  SolicitudPermisos,
  SolicitudVacaciones,
} from "../../../models/index.js";
import { sendEmail } from "../../../services/mail.js";
import { plantillaSolicitudPermisos } from "../../../common/plantillasEmail/emailTemplate.js";
import {
  assertId,
  assertDate,
  listDatesInclusive,
  fetchEstadoId,
  collectConflictDates,
  splitDatesBySchedule,
  normalizeDayChars,
} from "../../vacaciones/handlers/utils/vacacionesUtils.js";
import { buildScheduleTemplateFromHorario } from "../../../services/scheduleEngine/templateFromSchedule.js";
import { validateLeaveRequest } from "../../../services/scheduleEngine/leavePolicy.js";

const SUPPORTED_TYPES = Object.freeze({
  GOCE: "GOCE",
  SIN_GOCE: "SIN_GOCE",
});

const SUPPORTED_DURATIONS = Object.freeze({
  DIAS: "DIAS",
  HORAS: "HORAS",
});

function normalizeTipoPermiso(value) {
  const raw = String(value ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toUpperCase();
  if (!raw) {
    throw new Error("tipo_permiso es requerido");
  }
  if (!Object.values(SUPPORTED_TYPES).includes(raw)) {
    throw new Error(`tipo_permiso inválido. Valores permitidos: ${Object.values(SUPPORTED_TYPES).join(", ")}`);
  }
  return raw;
}

function normalizeTipoDuracion(value) {
  const raw = String(value ?? SUPPORTED_DURATIONS.DIAS)
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toUpperCase();

  if (!raw) return SUPPORTED_DURATIONS.DIAS;

  if (!Object.values(SUPPORTED_DURATIONS).includes(raw)) {
    throw new Error(
      `tipo_duracion inválido. Valores permitidos: ${Object.values(SUPPORTED_DURATIONS).join(
        ", ",
      )}`,
    );
  }

  return raw;
}

function normalizeTimeInput(value, fieldName) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    throw new Error(`${fieldName} es requerido`);
  }

  const match = raw.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    throw new Error(`${fieldName} debe tener formato HH:mm`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours > 23 || minutes > 59) {
    throw new Error(`${fieldName} tiene un valor inválido`);
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toMinutes(timeHHmm) {
  const [h, m] = String(timeHHmm).split(":").map(Number);
  return h * 60 + m;
}

function computeHorasPorDia({ contrato, horario }) {
  const horasSemanales = Number(contrato?.horas_semanales ?? 0);
  if (!Number.isFinite(horasSemanales) || horasSemanales <= 0) {
    return 0;
  }

  const workingChars = normalizeDayChars(horario?.dias_laborales);
  const workingDaysPerWeek = workingChars.size || 5;
  return horasSemanales / workingDaysPerWeek;
}

export async function solicitarPermiso({
  id_colaborador,
  tipo_permiso,
  tipo_duracion,
  fecha_inicio,
  fecha_fin,
  hora_inicio,
  hora_fin,
  id_aprobador,
}) {
  const idColaborador = assertId(id_colaborador, "id_colaborador");
  const tipo = normalizeTipoPermiso(tipo_permiso);
  const durationType = normalizeTipoDuracion(tipo_duracion);
  const startDate = assertDate(fecha_inicio, "fecha_inicio");
  const endDate = assertDate(fecha_fin, "fecha_fin");

  if (endDate.isBefore(startDate)) {
    throw new Error("fecha_fin no puede ser menor que fecha_inicio");
  }

  const requestedDates = listDatesInclusive(startDate, endDate);
  const startStr = startDate.format("YYYY-MM-DD");
  const endStr = endDate.format("YYYY-MM-DD");

  const tx = await sequelize.transaction();

  try {
    const colaborador = await Colaborador.findByPk(idColaborador, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!colaborador) {
      throw new Error(`No existe colaborador con id ${idColaborador}`);
    }

    const estadoActivoId = await fetchEstadoId({ transaction: tx, nombre: "ACTIVO" });
    const estadoPendienteId = await fetchEstadoId({ transaction: tx, nombre: "PENDIENTE" });
    const estadoAprobadoId = await fetchEstadoId({ transaction: tx, nombre: "APROBADO" });
    const blockingEstadoIds = [estadoPendienteId, estadoAprobadoId];

    const contratoActivo = await Contrato.findOne({
      where: {
        id_colaborador: idColaborador,
        estado: estadoActivoId,
      },
      order: [["fecha_inicio", "DESC"]],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!contratoActivo) {
      throw new Error("El colaborador no tiene un contrato ACTIVO");
    }

    const horarioActivo = await HorarioLaboral.findOne({
      where: {
        id_contrato: contratoActivo.id_contrato,
        estado: estadoActivoId,
      },
      order: [["fecha_actualizacion", "DESC"]],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!horarioActivo) {
      throw new Error("El contrato activo no tiene un horario ACTIVO asignado");
    }

    const { workingDates, restDates } = splitDatesBySchedule({
      requestedDates,
      horario: horarioActivo,
    });

    if (workingDates.length === 0) {
      throw new Error("Este dia que solicitaste es de descanso");
    }

    const workingDatesSet = new Set(workingDates);

    const existingIncapacidades = await JornadaDiaria.findAll({
      where: {
        id_colaborador: idColaborador,
        fecha: { [Op.between]: [startStr, endStr] },
        incapacidad: { [Op.ne]: null },
      },
      attributes: ["fecha"],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const incapacidadConflicts = existingIncapacidades
      .map((row) => String(row.fecha))
      .filter((date) => workingDatesSet.has(date));

    if (incapacidadConflicts.length > 0) {
      const conflict = incapacidadConflicts.sort()[0];
      throw new Error(`El día ${conflict} ya tiene una incapacidad registrada`);
    }

    const existingVacaciones = await SolicitudVacaciones.findAll({
      where: {
        id_colaborador: idColaborador,
        estado_solicitud: { [Op.in]: blockingEstadoIds },
        fecha_inicio: { [Op.lte]: endStr },
        fecha_fin: { [Op.gte]: startStr },
      },
      attributes: ["fecha_inicio", "fecha_fin"],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (existingVacaciones.length > 0) {
      const conflicts = Array.from(
        collectConflictDates({
          solicitudes: existingVacaciones,
          startStr,
          endStr,
        }),
      ).filter((date) => workingDatesSet.has(date));
      if (conflicts.length > 0) {
        const first = conflicts.sort()[0];
        throw new Error(`El día ${first} ya está reservado por vacaciones`);
      }
    }

    const existingPermisos = await SolicitudPermisos.findAll({
      where: {
        id_colaborador: idColaborador,
        estado_solicitud: { [Op.in]: blockingEstadoIds },
        fecha_inicio: { [Op.lte]: endStr },
        fecha_fin: { [Op.gte]: startStr },
      },
      attributes: ["fecha_inicio", "fecha_fin"],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (existingPermisos.length > 0) {
      const conflicts = Array.from(
        collectConflictDates({
          solicitudes: existingPermisos,
          startStr,
          endStr,
        }),
      ).filter((date) => workingDatesSet.has(date));
      if (conflicts.length > 0) {
        const first = conflicts.sort()[0];
        throw new Error(`El día ${first} ya tiene un permiso en trámite`);
      }
    }

    const idJefeDirecto = assertId(contratoActivo.id_jefe_directo, "id_jefe_directo");
    const idAprobador = assertId(id_aprobador, "id_aprobador");

    if (idAprobador !== idJefeDirecto) {
      throw new Error("El aprobador debe ser el jefe directo del colaborador");
    }

    const aprobador = await Colaborador.findByPk(idJefeDirecto, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!aprobador) {
      throw new Error(`No existe colaborador aprobador con id ${idJefeDirecto}`);
    }

    if (idAprobador === idColaborador) {
      console.warn(`SolicitudPermiso: el aprobador coincide con el solicitante (id ${idColaborador})`);
    }

    const horasPorDia = computeHorasPorDia({ contrato: contratoActivo, horario: horarioActivo });
    if (!Number.isFinite(horasPorDia) || horasPorDia <= 0) {
      throw new Error("No se pudo calcular la duración diaria de la jornada activa del colaborador");
    }

    let totalDias = workingDates.length;
    let totalHoras = Number((horasPorDia * totalDias).toFixed(2));
    let horaInicioNormalized = null;
    let horaFinNormalized = null;

    if (durationType === SUPPORTED_DURATIONS.HORAS) {
      if (!startDate.isSame(endDate)) {
        throw new Error("Los permisos por horas solo permiten una fecha");
      }

      horaInicioNormalized = normalizeTimeInput(hora_inicio, "hora_inicio");
      horaFinNormalized = normalizeTimeInput(hora_fin, "hora_fin");

      if (toMinutes(horaFinNormalized) <= toMinutes(horaInicioNormalized)) {
        throw new Error("hora_fin debe ser mayor que hora_inicio");
      }

      const scheduleTemplate = buildScheduleTemplateFromHorario({
        hora_inicio: horarioActivo.hora_inicio,
        hora_fin: horarioActivo.hora_fin,
        dias_laborales: horarioActivo.dias_laborales,
        dias_libres: horarioActivo.dias_libres,
        id_tipo_jornada: horarioActivo.id_tipo_jornada,
        timezone: "America/Costa_Rica",
      });

      const leaveValidation = validateLeaveRequest({
        fecha_inicio: `${startStr} ${horaInicioNormalized}:00`,
        fecha_fin: `${endStr} ${horaFinNormalized}:00`,
        template: scheduleTemplate,
        holidaysMap: new Map(),
      });

      if (!leaveValidation.allowed) {
        const firstViolation = leaveValidation.violations?.[0];
        throw new Error(firstViolation?.message || "El permiso por horas no es válido para el horario laboral");
      }

      totalHoras = Number(Number(leaveValidation.cantidad_horas ?? 0).toFixed(2));
      if (!Number.isFinite(totalHoras) || totalHoras <= 0) {
        throw new Error("La cantidad de horas del permiso debe ser mayor que cero");
      }

      totalDias = Number((totalHoras / horasPorDia).toFixed(2));
      if (!Number.isFinite(totalDias) || totalDias <= 0) {
        throw new Error("No se pudo calcular la proporción de días para el permiso por horas");
      }
    }

    const warnings = [];
    if (restDates.length > 0) {
      const listed = [...restDates].sort().join(", ");
      warnings.push(
        `Los siguientes días son de descanso según el horario activo y no se registrarán: ${listed}`,
      );
    }

    const solicitud = await SolicitudPermisos.create(
      {
        id_colaborador: idColaborador,
        id_aprobador: idAprobador,
        estado_solicitud: estadoPendienteId,
        fecha_inicio: startStr,
        fecha_fin: endStr,
        con_goce_salarial: tipo === SUPPORTED_TYPES.GOCE,
        cantidad_dias: totalDias,
        cantidad_horas: totalHoras,
      },
      { transaction: tx },
    );

    await tx.commit();

    const solicitanteNombre = [
      colaborador.nombre,
      colaborador.primer_apellido,
      colaborador.segundo_apellido,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    const tipoLabel = tipo === SUPPORTED_TYPES.GOCE ? "Con goce salarial" : "Sin goce salarial";

    if (aprobador?.correo_electronico) {
      try {
        await sendEmail({
          recipient: aprobador.correo_electronico,
          subject: "Nueva solicitud de permisos",
          message: plantillaSolicitudPermisos({
            solicitanteNombre: solicitanteNombre || `Colaborador ${idColaborador}`,
            fechaInicio: startStr,
            fechaFin: endStr,
            tipo: tipoLabel,
            cantidadDias: String(totalDias),
            cantidadHoras: String(totalHoras),
          }),
        });
      } catch (emailError) {
        console.error("Error enviando correo de solicitud de permiso:", emailError);
      }
    }

    return {
      id_solicitud: Number(solicitud.id_solicitud),
      id_colaborador: idColaborador,
      id_aprobador: idAprobador,
      estado_solicitud: "PENDIENTE",
      fecha_inicio: startStr,
      fecha_fin: endStr,
      con_goce_salarial: tipo === SUPPORTED_TYPES.GOCE,
      cantidad_dias: totalDias,
      cantidad_horas: totalHoras,
      tipo_permiso: tipo,
      tipo_duracion: durationType,
      ...(durationType === SUPPORTED_DURATIONS.HORAS
        ? {
            hora_inicio: horaInicioNormalized,
            hora_fin: horaFinNormalized,
            horas_solicitadas: totalHoras,
          }
        : {}),
      warnings,
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
}
