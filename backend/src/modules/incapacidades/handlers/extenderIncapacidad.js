import dayjs from "dayjs";
import { Op } from "sequelize";
import {
  sequelize,
  Colaborador,
  Contrato,
  Estado,
  HorarioLaboral,
  Incapacidad,
  JornadaDiaria,
  TipoIncapacidad,
} from "../../../models/index.js";
import { buildScheduleTemplateFromHorario } from "../../../services/scheduleEngine/templateFromSchedule.js";

const SUPPORTED_TYPES = Object.freeze({
  CCSS: "CCSS",
  LICENCIA_MATERNIDAD: "LICENCIA_MATERNIDAD",
});

function assertDate(value, fieldName) {
  const str = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD`);
  }
  const date = dayjs(str, "YYYY-MM-DD", true);
  if (!date.isValid()) {
    throw new Error(`${fieldName} es una fecha inválida`);
  }
  return date;
}

function listDatesInclusive(startDate, endDate) {
  const dates = [];
  let cursor = startDate.clone();
  const limit = endDate.clone();
  while (cursor.isBefore(limit) || cursor.isSame(limit)) {
    dates.push(cursor.format("YYYY-MM-DD"));
    cursor = cursor.add(1, "day");
  }
  return dates;
}

function getDayIndex(dateStr) {
  const jsDay = dayjs(dateStr, "YYYY-MM-DD", true).day();
  return jsDay === 0 ? 6 : jsDay - 1;
}

function computePercentages({ tipo, isRestDay, payableDayCounter }) {
  if (tipo === SUPPORTED_TYPES.LICENCIA_MATERNIDAD) {
    // Licencia de maternidad: 100% CCSS, 0% patrono (no suma a nómina)
    return { porcentaje_patrono: 0, porcentaje_ccss: 100 };
  }

  if (tipo === SUPPORTED_TYPES.CCSS) {
    if (isRestDay) {
      // Después de los 3 primeros días pagables, CCSS cubre también días de descanso
      if (payableDayCounter >= 3) {
        return { porcentaje_patrono: 0, porcentaje_ccss: 60 };
      }
      return { porcentaje_patrono: 0, porcentaje_ccss: 0 };
    }

    if (payableDayCounter <= 3) {
      return { porcentaje_patrono: 50, porcentaje_ccss: 50 };
    }

    return { porcentaje_patrono: 0, porcentaje_ccss: 60 };
  }

  throw new Error(`Tipo de incapacidad no soportado: ${tipo}`);
}

function buildRestDaysSet(horario) {
  if (!horario) return new Set();

  const template = buildScheduleTemplateFromHorario({
    hora_inicio: horario.hora_inicio,
    hora_fin: horario.hora_fin,
    dias_laborales: horario.dias_laborales,
    dias_libres: horario.dias_libres,
    id_tipo_jornada: horario.id_tipo_jornada,
    timezone: "America/Costa_Rica",
  });

  return new Set(template.restDays ?? []);
}

/**
 * Cuenta los días pagables que ya existen en el grupo para continuar el contador.
 * Reconstruye la lógica: recorre las jornadas existentes del grupo en orden cronológico,
 * y por cada día laboral (no de descanso) incrementa el contador.
 */
async function countExistingPayableDays({ grupo, tipo, restDays, tx }) {
  const existingRecords = await Incapacidad.findAll({
    where: { grupo },
    include: [{ model: JornadaDiaria, as: "jornadas", attributes: ["fecha"] }],
    order: [["id_incapacidad", "ASC"]],
    transaction: tx,
  });

  let count = 0;

  for (const record of existingRecords) {
    const jornadas = record.jornadas ?? [];
    for (const jornada of jornadas) {
      const dateStr = String(jornada.fecha);
      const dayIdx = getDayIndex(dateStr);
      const isRestDay = restDays.has(dayIdx);

      if (tipo === SUPPORTED_TYPES.LICENCIA_MATERNIDAD) {
        count += 1;
      } else if (tipo === SUPPORTED_TYPES.CCSS && !isRestDay) {
        count += 1;
      }
    }
  }

  return count;
}

export async function extenderIncapacidad({ grupo, fecha_fin }) {
  const tx = await sequelize.transaction();

  try {
    if (!grupo || typeof grupo !== "string" || grupo.trim() === "") {
      throw new Error("El grupo (UUID) de incapacidad es obligatorio");
    }

    const grupoId = grupo.trim();

    // Obtener todos los registros existentes del grupo
    const existingRecords = await Incapacidad.findAll({
      where: { grupo: grupoId },
      include: [
        { model: TipoIncapacidad, as: "tipo", attributes: ["id_tipo_incap", "nombre"] },
      ],
      order: [["id_incapacidad", "ASC"]],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (existingRecords.length === 0) {
      throw new Error(`No existe un grupo de incapacidad con UUID ${grupoId}`);
    }

    const firstRecord = existingRecords[0];
    const tipoRow = firstRecord.tipo;
    const tipoNombre = tipoRow?.nombre;

    if (!tipoNombre || !Object.values(SUPPORTED_TYPES).includes(tipoNombre)) {
      throw new Error(`Tipo de incapacidad no soportado: ${tipoNombre}`);
    }

    // Determinar el rango actual del grupo
    const fechaInicioGrupo = firstRecord.fecha_inicio;
    const fechaFinActual = firstRecord.fecha_fin;

    const newEndDate = assertDate(fecha_fin, "fecha_fin");
    const currentEndDate = dayjs(fechaFinActual, "YYYY-MM-DD", true);

    if (!newEndDate.isAfter(currentEndDate)) {
      throw new Error(
        `La nueva fecha_fin (${fecha_fin}) debe ser posterior a la fecha_fin actual (${fechaFinActual})`,
      );
    }

    // Días nuevos: desde el día siguiente al fin actual hasta la nueva fecha_fin
    const extensionStartDate = currentEndDate.add(1, "day");
    const newDates = listDatesInclusive(extensionStartDate, newEndDate);

    if (newDates.length === 0) {
      throw new Error("No hay días nuevos para registrar en la extensión");
    }

    // Obtener id_colaborador desde la jornada vinculada al primer registro
    const firstJornada = await JornadaDiaria.findOne({
      where: { incapacidad: firstRecord.id_incapacidad },
      attributes: ["id_colaborador"],
      transaction: tx,
    });

    if (!firstJornada) {
      throw new Error("No se encontró la jornada diaria vinculada al grupo de incapacidad");
    }

    const idColaborador = Number(firstJornada.id_colaborador);

    // Obtener contrato y horario activo
    const estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      attributes: ["id_estado"],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!estadoActivo) {
      throw new Error("No se encontró el estado ACTIVO en el catálogo");
    }

    const estadoActivoId = Number(estadoActivo.id_estado);

    const contratoActivo = await Contrato.findOne({
      where: { id_colaborador: idColaborador, estado: estadoActivoId },
      order: [["fecha_inicio", "DESC"]],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!contratoActivo) {
      throw new Error("El colaborador no tiene un contrato ACTIVO");
    }

    const horarioActivo = await HorarioLaboral.findOne({
      where: { id_contrato: contratoActivo.id_contrato, estado: estadoActivoId },
      order: [["fecha_actualizacion", "DESC"]],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!horarioActivo) {
      throw new Error("El contrato activo no tiene un horario ACTIVO asignado");
    }

    const restDays = buildRestDaysSet(horarioActivo);

    // Contar días pagables existentes para continuar el contador
    let payableDayCounter = await countExistingPayableDays({
      grupo: grupoId,
      tipo: tipoNombre,
      restDays,
      tx,
    });

    // Obtener jornadas existentes en el rango de extensión
    const existingJornadas = await JornadaDiaria.findAll({
      where: {
        id_colaborador: idColaborador,
        fecha: { [Op.in]: newDates },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const jornadasByDate = new Map();
    for (const jornada of existingJornadas) {
      jornadasByDate.set(String(jornada.fecha), jornada);
    }

    const newFechaFinStr = newEndDate.format("YYYY-MM-DD");
    const registros = [];

    for (const dateStr of newDates) {
      const dayIdx = getDayIndex(dateStr);
      const isRestDay = restDays.has(dayIdx);
      const isPayableDay = tipoNombre === SUPPORTED_TYPES.LICENCIA_MATERNIDAD || !isRestDay;

      if (tipoNombre === SUPPORTED_TYPES.CCSS && isRestDay) {
        // no incrementa contador
      } else if (isPayableDay) {
        payableDayCounter += 1;
      }

      const { porcentaje_patrono, porcentaje_ccss } = computePercentages({
        tipo: tipoNombre,
        isRestDay,
        payableDayCounter,
      });

      const incapacidad = await Incapacidad.create(
        {
          id_tipo_incap: Number(tipoRow.id_tipo_incap),
          porcentaje_patrono,
          porcentaje_ccss,
          grupo: grupoId,
          fecha_inicio: fechaInicioGrupo,
          fecha_fin: newFechaFinStr,
        },
        { transaction: tx },
      );

      const jornadaExistente = jornadasByDate.get(dateStr);

      if (jornadaExistente) {
        if (Number(jornadaExistente.incapacidad)) {
          throw new Error(`Ya existe una incapacidad en jornada ${dateStr}`);
        }

        // Incapacidad tiene prioridad: sobrescribe vacaciones, permisos y horas
        await jornadaExistente.update(
          {
            horas_ordinarias: 0,
            horas_extra: 0,
            horas_nocturnas: 0,
            incapacidad: Number(incapacidad.id_incapacidad),
            vacaciones: null,
            permiso: null,
          },
          { transaction: tx },
        );
      } else {
        await JornadaDiaria.create(
          {
            id_colaborador: idColaborador,
            fecha: dateStr,
            horas_ordinarias: 0,
            horas_extra: 0,
            horas_nocturnas: 0,
            incapacidad: Number(incapacidad.id_incapacidad),
          },
          { transaction: tx },
        );
      }

      registros.push({
        fecha: dateStr,
        id_incapacidad: Number(incapacidad.id_incapacidad),
        porcentaje_patrono,
        porcentaje_ccss,
        es_dia_laboral: !isRestDay,
      });
    }

    // Actualizar fecha_fin en todos los registros previos del grupo
    await Incapacidad.update(
      { fecha_fin: newFechaFinStr },
      { where: { grupo: grupoId }, transaction: tx },
    );

    await tx.commit();

    return {
      id_colaborador: idColaborador,
      grupo: grupoId,
      tipo_incapacidad: tipoNombre,
      fecha_inicio: fechaInicioGrupo,
      fecha_fin: newFechaFinStr,
      dias_previos: payableDayCounter - registros.filter((r) => r.es_dia_laboral).length,
      fechas_extendidas: registros,
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
}
