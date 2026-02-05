import { Op } from "sequelize";
import {
  sequelize,
  Colaborador,
  Contrato,
  HorarioLaboral,
  SolicitudVacaciones,
  SolicitudPermisos,
  JornadaDiaria,
  SaldoVacaciones,
  Feriado,
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

export async function solicitarVacaciones({
  id_colaborador,
  id_aprobador,
  fecha_inicio,
  fecha_fin,
}) {
  const idColaborador = assertId(id_colaborador, "id_colaborador");
  const idAprobador = assertId(id_aprobador, "id_aprobador");
  const startDate = assertDate(fecha_inicio, "fecha_inicio");
  const endDate = assertDate(fecha_fin, "fecha_fin");

  if (endDate.isBefore(startDate)) {
    throw new Error("fecha_fin no puede ser menor que fecha_inicio");
  }

  const startStr = startDate.format("YYYY-MM-DD");
  const endStr = endDate.format("YYYY-MM-DD");
  const requestedDates = listDatesInclusive(startDate, endDate);

  const tx = await sequelize.transaction();

  try {
    const colaborador = await Colaborador.findByPk(idColaborador, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    if (!colaborador) {
      throw new Error(`No existe colaborador con id ${idColaborador}`);
    }

    const aprobador = await Colaborador.findByPk(idAprobador, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    if (!aprobador) {
      throw new Error(`No existe colaborador aprobador con id ${idAprobador}`);
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

    const saldoVacaciones = await SaldoVacaciones.findOne({
      where: { id_colaborador: idColaborador },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });
    if (!saldoVacaciones) {
      throw new Error("No se encontró saldo de vacaciones para el colaborador");
    }

    const existingVacaciones = await SolicitudVacaciones.findAll({
      where: {
        id_colaborador: idColaborador,
        estado_solicitud: { [Op.in]: blockingEstadoIds },
        fecha_inicio: { [Op.lte]: endStr },
        fecha_fin: { [Op.gte]: startStr },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const existingPermisos = await SolicitudPermisos.findAll({
      where: {
        id_colaborador: idColaborador,
        estado_solicitud: { [Op.in]: blockingEstadoIds },
        fecha_inicio: { [Op.lte]: endStr },
        fecha_fin: { [Op.gte]: startStr },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const existingJornadas = await JornadaDiaria.findAll({
      where: {
        id_colaborador: idColaborador,
        fecha: { [Op.between]: [startStr, endStr] },
        incapacidad: { [Op.ne]: null },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const conflictDates = new Set();
    const vacationConflicts = collectConflictDates({ solicitudes: existingVacaciones, startStr, endStr });
    const permisoConflicts = collectConflictDates({ solicitudes: existingPermisos, startStr, endStr });

    for (const d of vacationConflicts) conflictDates.add(d);
    for (const d of permisoConflicts) conflictDates.add(d);
    for (const jornada of existingJornadas) {
      conflictDates.add(String(jornada.fecha));
    }

    if (conflictDates.size > 0) {
      const sorted = Array.from(conflictDates).sort();
      throw new Error(
        `No se puede crear la solicitud por solapamiento con los días: ${sorted.join(", ")}`
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

    if (workingDates.length === 0) {
      throw new Error("Este dia que solicitaste es de descanso");
    }

    const chargeableDates = workingDates.filter((date) => !feriadoDates.has(date));

    const diasGanados = Number(saldoVacaciones.dias_ganados);
    const diasTomados = Number(saldoVacaciones.dias_tomados);
    const disponiblesPrevios = diasGanados - diasTomados;

    if (chargeableDates.length > disponiblesPrevios) {
      throw new Error(
        `La solicitud requiere ${chargeableDates.length} días cobrables y solo hay ${disponiblesPrevios} disponibles`
      );
    }

    const solicitud = await SolicitudVacaciones.create(
      {
        id_colaborador: idColaborador,
        id_aprobador: idAprobador,
        estado_solicitud: estadoPendienteId,
        fecha_inicio: startStr,
        fecha_fin: endStr,
        id_saldo_vacaciones: Number(saldoVacaciones.id_saldo_vac),
      },
      { transaction: tx }
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

    const subject = "Tienes una solicitud de vacaciones";
    const message = `Hola ${aprobador.nombre},<br/><br/>` +
      `${solicitanteNombre || `Colaborador ${idColaborador}`} ha solicitado vacaciones del ${startStr} al ${endStr}.<br/><br/>` +
      `Por favor ingresa al sistema para revisarla.`;

    try {
      if (aprobador.correo_electronico) {
        await sendEmail({
          recipient: aprobador.correo_electronico,
          subject,
          message,
        });
      }
    } catch (emailError) {
      console.error("Error enviando correo de solicitud de vacaciones:", emailError);
    }

    const warnings = [];
    if (feriadoDates.size > 0) {
      const listed = Array.from(feriadoDates).sort().join(", ");
      warnings.push(
        `Advertencia: los siguientes días son feriados y no se descontarán del saldo: ${listed}`
      );
    }
    if (restDates.length > 0) {
      const listed = restDates.sort().join(", ");
      warnings.push(
        `Los siguientes días son de descanso según el horario activo y no se descontarán: ${listed}`
      );
    }

    return {
      id_solicitud_vacaciones: Number(solicitud.id_solicitud_vacaciones),
      id_colaborador: idColaborador,
      id_aprobador: idAprobador,
      estado_solicitud: "PENDIENTE",
      fecha_inicio: startStr,
      fecha_fin: endStr,
      id_saldo_vacaciones: Number(saldoVacaciones.id_saldo_vac),
      dias_solicitados: String(requestedDates.length),
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
        disponibles: disponiblesPrevios,
        id_saldo_vacaciones: Number(saldoVacaciones.id_saldo_vac),
      },
      warnings,
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
}
