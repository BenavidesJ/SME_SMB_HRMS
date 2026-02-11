import { Op } from "sequelize";
import {
  sequelize,
  Colaborador,
  Contrato,
  HorarioLaboral,
  JornadaDiaria,
  SolicitudPermisos,
  SolicitudVacaciones,
  Usuario,
  Rol,
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

const SUPPORTED_TYPES = Object.freeze({
  GOCE: "GOCE",
  SIN_GOCE: "SIN_GOCE",
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

async function resolveAprobador({ providedId, transaction, estadoActivoId }) {
  if (providedId !== undefined && providedId !== null) {
    const id = assertId(providedId, "id_aprobador");
    const aprobador = await Colaborador.findByPk(id, {
      transaction,
      lock: transaction?.LOCK?.UPDATE,
    });
    if (!aprobador) {
      throw new Error(`No existe colaborador aprobador con id ${id}`);
    }
    return { id, aprobador };
  }

  const adminUsuario = await Usuario.findOne({
    include: [
      {
        model: Rol,
        as: "rol",
        attributes: [],
        required: true,
        where: {
          nombre: { [Op.in]: ["ADMINISTRADOR", "SUPER_ADMIN"] },
        },
      },
    ],
    where: { estado: estadoActivoId },
    order: [["id_usuario", "ASC"]],
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  if (!adminUsuario) {
    throw new Error("No se encontró un aprobador por defecto para la solicitud de permiso");
  }

  const adminColaboradorId = assertId(adminUsuario.id_colaborador, "id_aprobador");
  const aprobador = await Colaborador.findByPk(adminColaboradorId, {
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  if (!aprobador) {
    throw new Error("El aprobador por defecto no está asociado a un colaborador válido");
  }

  return { id: adminColaboradorId, aprobador };
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
  fecha_inicio,
  fecha_fin,
  id_aprobador,
}) {
  const idColaborador = assertId(id_colaborador, "id_colaborador");
  const tipo = normalizeTipoPermiso(tipo_permiso);
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

    const { id: idAprobador, aprobador } = await resolveAprobador({
      providedId: id_aprobador,
      transaction: tx,
      estadoActivoId,
    });

    if (idAprobador === idColaborador) {
      console.warn(`SolicitudPermiso: el aprobador coincide con el solicitante (id ${idColaborador})`);
    }

    const horasPorDia = computeHorasPorDia({ contrato: contratoActivo, horario: horarioActivo });
    const totalDias = workingDates.length;
    const totalHoras = Number((horasPorDia * totalDias).toFixed(2));

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
      warnings,
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
}
