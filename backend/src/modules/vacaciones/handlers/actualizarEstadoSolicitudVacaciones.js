import { Op } from "sequelize";
import {
  sequelize,
  SolicitudVacaciones,
  SolicitudPermisos,
  JornadaDiaria,
  SaldoVacaciones,
  Contrato,
  HorarioLaboral,
  Usuario,
  Feriado,
  Colaborador,
} from "../../../models/index.js";
import { sendEmail } from "../../../services/mail.js";
import {
  assertId,
  assertDate,
  listDatesInclusive,
  fetchEstadoId,
  collectConflictDates,
  splitDatesBySchedule,
} from "./utils/vacacionesUtils.js";

const ESTADOS_VALIDOS = new Set(["APROBADO", "RECHAZADO"]);

function buildNombreCompleto({ nombre, primer_apellido, segundo_apellido }) {
  return [nombre, primer_apellido, segundo_apellido].filter(Boolean).join(" ").trim();
}

async function notificarCambioEstadoVacaciones({ colaborador, estadoDestino, fechaInicio, fechaFin }) {
  if (!colaborador?.correo_electronico) {
    return;
  }

  const nombre = buildNombreCompleto(colaborador) || `Colaborador ${colaborador.id_colaborador}`;
  const estadoHumano = estadoDestino === "APROBADO" ? "aprobada" : "rechazada";
  const subject = `Tu solicitud de vacaciones fue ${estadoHumano}`;
  const message = `Hola ${nombre.split(" ")[0]},<br/><br/>` +
    `Tu solicitud de vacaciones del ${fechaInicio} al ${fechaFin} ha sido ${estadoHumano}.<br/><br/>` +
    `Ingresa al sistema para revisar los detalles.`;

  try {
    await sendEmail({ recipient: colaborador.correo_electronico, subject, message });
  } catch (error) {
    console.error("Error enviando correo de actualización de vacaciones:", error);
  }
}

export async function actualizarEstadoSolicitudVacaciones({
  id_solicitud_vacaciones,
  nuevo_estado,
  id_usuario_actor,
}) {
  const solicitudId = assertId(id_solicitud_vacaciones, "id_solicitud_vacaciones");
  const usuarioActorId = assertId(id_usuario_actor, "id_usuario_actor");
  const estadoDestino = String(nuevo_estado ?? "").trim().toUpperCase();

  if (!ESTADOS_VALIDOS.has(estadoDestino)) {
    throw new Error("nuevo_estado debe ser APROBADO o RECHAZADO");
  }

  const tx = await sequelize.transaction();

  try {
    const estadoPendienteId = await fetchEstadoId({ transaction: tx, nombre: "PENDIENTE" });
    const estadoAprobadoId = await fetchEstadoId({ transaction: tx, nombre: "APROBADO" });
    const estadoRechazadoId = await fetchEstadoId({ transaction: tx, nombre: "RECHAZADO" });
    const estadoActivoId = await fetchEstadoId({ transaction: tx, nombre: "ACTIVO" });

    const usuarioActor = await Usuario.findByPk(usuarioActorId, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      attributes: ["id_usuario", "id_colaborador"],
    });

    if (!usuarioActor) {
      throw new Error(`No existe el usuario con id ${usuarioActorId}`);
    }

    const actorColaboradorId = Number(usuarioActor.id_colaborador);

    const solicitud = await SolicitudVacaciones.findByPk(solicitudId, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!solicitud) {
      throw new Error(`No existe la solicitud de vacaciones ${solicitudId}`);
    }

    if (Number(solicitud.estado_solicitud) !== estadoPendienteId) {
      throw new Error("Solo se pueden cambiar solicitudes en estado PENDIENTE");
    }

    if (Number(solicitud.id_aprobador) !== actorColaboradorId) {
      throw new Error("El usuario autenticado no es el aprobador asignado de esta solicitud");
    }

    const solicitante = await Colaborador.findByPk(solicitud.id_colaborador, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      attributes: [
        "id_colaborador",
        "nombre",
        "primer_apellido",
        "segundo_apellido",
        "correo_electronico",
      ],
    });

    if (!solicitante) {
      throw new Error("No se encontró el colaborador solicitante asociado a la solicitud");
    }

    const startDate = assertDate(solicitud.fecha_inicio, "fecha_inicio");
    const endDate = assertDate(solicitud.fecha_fin, "fecha_fin");
    const startStr = startDate.format("YYYY-MM-DD");
    const endStr = endDate.format("YYYY-MM-DD");
    const requestedDates = listDatesInclusive(startDate, endDate);

    let resultado = {
      id_solicitud_vacaciones: solicitudId,
      estado_solicitud: estadoDestino,
      dias_cobrables: [],
      dias_descanso: [],
      dias_feriados: [],
      warnings: [],
    };

    if (estadoDestino === "RECHAZADO") {
      await solicitud.update({ estado_solicitud: estadoRechazadoId }, { transaction: tx });
      await tx.commit();

      await notificarCambioEstadoVacaciones({
        colaborador: solicitante,
        estadoDestino,
        fechaInicio: startStr,
        fechaFin: endStr,
      });
      return resultado;
    }

    const contratoActivo = await Contrato.findOne({
      where: {
        id_colaborador: solicitud.id_colaborador,
        estado: estadoActivoId,
      },
      order: [["fecha_inicio", "DESC"]],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!contratoActivo) {
      throw new Error("El colaborador ya no tiene un contrato ACTIVO");
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
      throw new Error("El contrato activo ya no tiene un horario ACTIVO asignado");
    }

    const blockingEstadoIds = [estadoPendienteId, estadoAprobadoId];

    const otrasVacaciones = await SolicitudVacaciones.findAll({
      where: {
        id_colaborador: solicitud.id_colaborador,
        id_solicitud_vacaciones: { [Op.ne]: solicitudId },
        estado_solicitud: { [Op.in]: blockingEstadoIds },
        fecha_inicio: { [Op.lte]: endStr },
        fecha_fin: { [Op.gte]: startStr },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const permisos = await SolicitudPermisos.findAll({
      where: {
        id_colaborador: solicitud.id_colaborador,
        estado_solicitud: estadoAprobadoId,
        fecha_inicio: { [Op.lte]: endStr },
        fecha_fin: { [Op.gte]: startStr },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const jornadasIncapacidad = await JornadaDiaria.findAll({
      where: {
        id_colaborador: solicitud.id_colaborador,
        fecha: { [Op.between]: [startStr, endStr] },
        incapacidad: { [Op.ne]: null },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const conflictDates = new Set();
    for (const d of collectConflictDates({ solicitudes: otrasVacaciones, startStr, endStr })) {
      conflictDates.add(d);
    }
    for (const d of collectConflictDates({ solicitudes: permisos, startStr, endStr })) {
      conflictDates.add(d);
    }
    for (const jornada of jornadasIncapacidad) {
      conflictDates.add(String(jornada.fecha));
    }

    if (conflictDates.size > 0) {
      const sorted = Array.from(conflictDates).sort();
      throw new Error(
        `No se puede aprobar la solicitud por solapamiento con los días: ${sorted.join(", ")}`
      );
    }

    const feriados = await Feriado.findAll({
      where: { fecha: { [Op.in]: requestedDates } },
      attributes: ["fecha", "nombre"],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    const feriadoDates = new Set(feriados.map((f) => String(f.fecha)));

    const { workingDates, restDates } = splitDatesBySchedule({
      requestedDates,
      horario: horarioActivo,
    });

    const chargeableDates = workingDates.filter((date) => !feriadoDates.has(date));

    const jornadasExistentes = await JornadaDiaria.findAll({
      where: {
        id_colaborador: solicitud.id_colaborador,
        fecha: { [Op.in]: workingDates },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const jornadasPorFecha = new Map(
      jornadasExistentes.map((row) => [String(row.fecha), row])
    );

    for (const date of workingDates) {
      const existing = jornadasPorFecha.get(date);
      if (existing) {
        if (
          (existing.incapacidad && Number(existing.incapacidad) !== 0) ||
          (existing.permiso && Number(existing.permiso) !== 0) ||
          (existing.vacaciones && Number(existing.vacaciones) !== solicitudId)
        ) {
          throw new Error(`La fecha ${date} ya está asociada a otra jornada incompatible`);
        }
        await existing.update(
          {
            horas_ordinarias: 0,
            horas_extra: 0,
            horas_nocturnas: 0,
            vacaciones: solicitudId,
          },
          { transaction: tx }
        );
      } else {
        await JornadaDiaria.create(
          {
            id_colaborador: solicitud.id_colaborador,
            fecha: date,
            horas_ordinarias: 0,
            horas_extra: 0,
            horas_nocturnas: 0,
            vacaciones: solicitudId,
          },
          { transaction: tx }
        );
      }
    }

    const saldo = await SaldoVacaciones.findByPk(solicitud.id_saldo_vacaciones, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!saldo) {
      throw new Error("No se encontró el saldo de vacaciones asociado a la solicitud");
    }

    const diasGanados = Number(saldo.dias_ganados);
    const diasTomadosActuales = Number(saldo.dias_tomados);
    const disponiblesPrevios = diasGanados - diasTomadosActuales;

    if (chargeableDates.length > disponiblesPrevios) {
      throw new Error(
        `No se puede aprobar la solicitud: requiere ${chargeableDates.length} días y solo hay ${disponiblesPrevios} disponibles`
      );
    }

    const diasTomadosActualizados = diasTomadosActuales + chargeableDates.length;
    await saldo.update({ dias_tomados: diasTomadosActualizados }, { transaction: tx });

    await solicitud.update({ estado_solicitud: estadoAprobadoId }, { transaction: tx });

    resultado = {
      ...resultado,
      dias_cobrables: chargeableDates,
      dias_descanso: restDates,
      dias_feriados: Array.from(feriadoDates).sort(),
      meta_engine: {
        chargeableDays: chargeableDates.length,
        chargeableDates,
        skippedDates: [
          ...Array.from(feriadoDates).map((date) => ({
            date,
            reason: "FERIADO",
            holiday: feriados.find((f) => String(f.fecha) === date)?.nombre ?? null,
          })),
          ...restDates.map((date) => ({
            date,
            reason: "DESCANSO",
            holiday: null,
          })),
        ].sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0)),
        dias_ganados_recalculados: diasGanados,
        disponibles: diasGanados - diasTomadosActualizados,
        id_saldo_vacaciones: Number(solicitud.id_saldo_vacaciones),
      },
    };

    await tx.commit();

    await notificarCambioEstadoVacaciones({
      colaborador: solicitante,
      estadoDestino,
      fechaInicio: startStr,
      fechaFin: endStr,
    });

    return resultado;
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
}
