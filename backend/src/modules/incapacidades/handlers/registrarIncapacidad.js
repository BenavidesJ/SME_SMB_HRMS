import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";
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

function normalizeTipo(value) {
  const raw = String(value ?? "").trim();
  if (!raw) throw new Error("tipo_incap es obligatorio");
  return raw.replace(/\s+/g, "_").toUpperCase();
}

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

export async function registrarIncapacidad({
  id_colaborador,
  fecha_inicio,
  fecha_fin,
  tipo_incap,
}) {
  const tx = await sequelize.transaction();

  try {
    const tipo = normalizeTipo(tipo_incap);
    if (!Object.values(SUPPORTED_TYPES).includes(tipo)) {
      throw new Error(`Tipo de incapacidad no soportado todavía: ${tipo}`);
    }

    const idColaborador = Number(id_colaborador);
    if (!Number.isInteger(idColaborador) || idColaborador <= 0) {
      throw new Error("id_colaborador debe ser un número entero positivo");
    }

    const startDate = assertDate(fecha_inicio, "fecha_inicio");
    const endDate = assertDate(fecha_fin, "fecha_fin");

    if (endDate.isBefore(startDate)) {
      throw new Error("fecha_fin no puede ser menor que fecha_inicio");
    }

    const dates = listDatesInclusive(startDate, endDate);

    const grupo = uuidv4();
    const fechaInicioStr = startDate.format("YYYY-MM-DD");
    const fechaFinStr = endDate.format("YYYY-MM-DD");

    const colaborador = await Colaborador.findByPk(idColaborador, {
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!colaborador) {
      throw new Error(`No existe colaborador con id ${idColaborador}`);
    }

    const tipoRow = await TipoIncapacidad.findOne({
      where: { nombre: tipo },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!tipoRow) {
      throw new Error(`No existe el tipo de incapacidad ${tipo}`);
    }

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

    const restDays = buildRestDaysSet(horarioActivo);

    const existingJornadas = await JornadaDiaria.findAll({
      where: {
        id_colaborador: idColaborador,
        fecha: { [Op.in]: dates },
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    const jornadasByDate = new Map();
    for (const jornada of existingJornadas) {
      jornadasByDate.set(String(jornada.fecha), jornada);
    }

    const registros = [];
    let payableDayCounter = 0;

    for (const dateStr of dates) {
      const dayIdx = getDayIndex(dateStr);
      const isRestDay = restDays.has(dayIdx);
      const isPayableDay = tipo === SUPPORTED_TYPES.LICENCIA_MATERNIDAD || !isRestDay;

      if (tipo === SUPPORTED_TYPES.CCSS && isRestDay) {
        // no incrementa contador
      } else if (isPayableDay) {
        payableDayCounter += 1;
      }

      const { porcentaje_patrono, porcentaje_ccss } = computePercentages({
        tipo,
        isRestDay,
        payableDayCounter,
      });

      const incapacidad = await Incapacidad.create(
        {
          id_tipo_incap: Number(tipoRow.id_tipo_incap),
          porcentaje_patrono,
          porcentaje_ccss,
          grupo,
          fecha_inicio: fechaInicioStr,
          fecha_fin: fechaFinStr,
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

    await tx.commit();

    return {
      id_colaborador: idColaborador,
      grupo,
      tipo_incapacidad: tipoRow.nombre,
      fecha_inicio: fechaInicioStr,
      fecha_fin: fechaFinStr,
      fechas_registradas: registros,
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
}
