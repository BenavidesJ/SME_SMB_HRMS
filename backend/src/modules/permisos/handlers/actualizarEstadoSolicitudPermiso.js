import { Op } from "sequelize";
import {
  sequelize,
  SolicitudPermisos,
  SolicitudVacaciones,
  JornadaDiaria,
  Usuario,
  Colaborador,
  Contrato,
  HorarioLaboral,
} from "../../../models/index.js";
import { sendEmail } from "../../../services/mail.js";
import {
  assertId,
  assertDate,
  listDatesInclusive,
  fetchEstadoId,
  collectConflictDates,
  splitDatesBySchedule,
} from "../../vacaciones/handlers/utils/vacacionesUtils.js";

const ESTADOS_VALIDOS = new Set(["APROBADO", "RECHAZADO"]);

function buildNombreCompleto({ nombre, primer_apellido, segundo_apellido }) {
  return [nombre, primer_apellido, segundo_apellido].filter(Boolean).join(" ").trim();
}

async function notificarSolicitante({ colaborador, estadoDestino, fechaInicio, fechaFin }) {
  if (!colaborador?.correo_electronico) {
    return;
  }

  const nombre = buildNombreCompleto(colaborador) || `Colaborador ${colaborador.id_colaborador}`;
  const estadoHumano = estadoDestino === "APROBADO" ? "aprobada" : "rechazada";
  const subject = `Tu solicitud de permiso fue ${estadoHumano}`;
  const message = `Hola ${nombre.split(" ")[0]},<br/><br/>` +
    `Tu solicitud de permiso del ${fechaInicio} al ${fechaFin} ha sido ${estadoHumano}.<br/><br/>` +
    `Si tienes dudas, comunícate con tu administrador.`;

  try {
    await sendEmail({ recipient: colaborador.correo_electronico, subject, message });
  } catch (error) {
    console.error("Error enviando correo de actualización de permiso:", error);
  }
}

export async function actualizarEstadoSolicitudPermiso({
  id_solicitud_permiso,
  nuevo_estado,
  id_usuario_actor,
}) {
  const solicitudId = assertId(id_solicitud_permiso, "id_solicitud_permiso");
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

    const solicitud = await SolicitudPermisos.findByPk(solicitudId, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!solicitud) {
      throw new Error(`No existe la solicitud de permiso ${solicitudId}`);
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

    if (estadoDestino === "RECHAZADO") {
      await solicitud.update({ estado_solicitud: estadoRechazadoId }, { transaction: tx });
      await tx.commit();

      await notificarSolicitante({
        colaborador: solicitante,
        estadoDestino,
        fechaInicio: startStr,
        fechaFin: endStr,
      });

      return {
        id_solicitud: solicitudId,
        estado_solicitud: estadoDestino,
      };
    }

    const requestedDates = listDatesInclusive(startDate, endDate);

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

    const { workingDates, restDates } = splitDatesBySchedule({
      requestedDates,
      horario: horarioActivo,
    });

    if (workingDates.length === 0) {
      throw new Error("La solicitud ya no contiene días laborables según el horario actual");
    }

    const blockingEstadoIds = [estadoPendienteId, estadoAprobadoId];

    const otrasSolicitudes = await SolicitudPermisos.findAll({
      where: {
        id_colaborador: solicitud.id_colaborador,
        id_solicitud: { [Op.ne]: solicitudId },
        estado_solicitud: { [Op.in]: blockingEstadoIds },
        fecha_inicio: { [Op.lte]: endStr },
        fecha_fin: { [Op.gte]: startStr },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      attributes: ["fecha_inicio", "fecha_fin"],
    });

    const vacaciones = await SolicitudVacaciones.findAll({
      where: {
        id_colaborador: solicitud.id_colaborador,
        estado_solicitud: { [Op.in]: blockingEstadoIds },
        fecha_inicio: { [Op.lte]: endStr },
        fecha_fin: { [Op.gte]: startStr },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
      attributes: ["fecha_inicio", "fecha_fin"],
    });

    const jornadas = await JornadaDiaria.findAll({
      where: {
        id_colaborador: solicitud.id_colaborador,
        fecha: { [Op.between]: [startStr, endStr] },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const conflictDates = new Set();
    for (const d of collectConflictDates({ solicitudes: otrasSolicitudes, startStr, endStr })) {
      conflictDates.add(d);
    }
    for (const d of collectConflictDates({ solicitudes: vacaciones, startStr, endStr })) {
      conflictDates.add(d);
    }

    const jornadasPorFecha = new Map();
    for (const jornada of jornadas) {
      const fecha = String(jornada.fecha);
      jornadasPorFecha.set(fecha, jornada);
      if (jornada.incapacidad) {
        conflictDates.add(fecha);
      }
      if (jornada.vacaciones) {
        conflictDates.add(fecha);
      }
      if (jornada.permiso && Number(jornada.permiso) !== solicitudId) {
        conflictDates.add(fecha);
      }
    }

    for (const rest of restDates) {
      conflictDates.delete(rest);
    }

    if (conflictDates.size > 0) {
      const sorted = Array.from(conflictDates).sort();
      throw new Error(
        `No se puede aprobar la solicitud por solapamiento con los días: ${sorted.join(", ")}`,
      );
    }

    for (const date of workingDates) {
      const existente = jornadasPorFecha.get(date);
      if (existente) {
        await existente.update(
          {
            horas_ordinarias: 0,
            horas_extra: 0,
            horas_nocturnas: 0,
            permiso: solicitudId,
          },
          { transaction: tx },
        );
      } else {
        await JornadaDiaria.create(
          {
            id_colaborador: solicitud.id_colaborador,
            fecha: date,
            horas_ordinarias: 0,
            horas_extra: 0,
            horas_nocturnas: 0,
            permiso: solicitudId,
          },
          { transaction: tx },
        );
      }
    }

    await solicitud.update({ estado_solicitud: estadoAprobadoId }, { transaction: tx });

    await tx.commit();

    await notificarSolicitante({
      colaborador: solicitante,
      estadoDestino,
      fechaInicio: startStr,
      fechaFin: endStr,
    });

    return {
      id_solicitud: solicitudId,
      estado_solicitud: estadoDestino,
      fechas_registradas: workingDates,
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
}
