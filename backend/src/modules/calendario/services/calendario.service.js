import dayjs from "dayjs";
import { Op } from "sequelize";
import {
  Colaborador,
  Contrato,
  Estado,
  HorarioLaboral,
  JornadaDiaria,
  SolicitudPermisos,
  SolicitudVacaciones,
  Usuario,
} from "../../../models/index.js";

const DAY_INDEX_TO_CHAR = Object.freeze({
  0: "D",
  1: "L",
  2: "M",
  3: "K",
  4: "J",
  5: "V",
  6: "S",
});

const EVENT_PRIORITY = Object.freeze({
  incapacidad: 6,
  vacaciones: 5,
  permiso: 4,
  aniversario: 3,
  cumpleanios: 2,
  laboral: 1,
  none: 0,
});

function parseDateOnly(value, fieldName) {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD`);
  }

  const d = dayjs(raw, "YYYY-MM-DD", true);
  if (!d.isValid()) {
    throw new Error(`${fieldName} no es una fecha válida`);
  }

  return d;
}

function buildDefaultRange() {
  const now = dayjs();
  return {
    from: now.startOf("month").subtract(1, "month"),
    to: now.endOf("month").add(1, "month"),
  };
}

function listDatesInclusive(from, to) {
  const dates = [];
  let cursor = from.startOf("day");
  const end = to.startOf("day");

  while (cursor.isBefore(end) || cursor.isSame(end)) {
    dates.push(cursor.format("YYYY-MM-DD"));
    cursor = cursor.add(1, "day");
  }

  return dates;
}

function normalizeDayCodes(value) {
  const chars = new Set();
  for (const ch of String(value ?? "").trim().toUpperCase()) {
    if (["D", "L", "M", "K", "J", "V", "S"].includes(ch)) {
      chars.add(ch);
    }
  }
  return chars;
}

function getDayCode(dateStr) {
  const d = parseDateOnly(dateStr, "fecha");
  return DAY_INDEX_TO_CHAR[d.day()];
}

function overlapsRange(startDate, endDate, fromStr, toStr) {
  return String(startDate) <= String(toStr) && String(endDate) >= String(fromStr);
}

function getTopType(eventTypes, isWorkday) {
  const candidates = [...eventTypes];
  if (isWorkday) candidates.push("laboral");

  let top = "none";
  let topScore = EVENT_PRIORITY.none;

  for (const type of candidates) {
    const score = EVENT_PRIORITY[type] ?? EVENT_PRIORITY.none;
    if (score > topScore) {
      top = type;
      topScore = score;
    }
  }

  return top === "none" ? null : top;
}

async function resolveActorFromToken(tokenId) {
  const numericId = Number(tokenId);

  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error("No se pudo identificar al usuario autenticado");
  }

  let usuario = await Usuario.findByPk(numericId, {
    attributes: ["id_usuario", "id_colaborador"],
  });

  if (!usuario) {
    usuario = await Usuario.findOne({
      where: { id_colaborador: numericId },
      attributes: ["id_usuario", "id_colaborador"],
    });
  }

  if (!usuario) {
    throw new Error("El usuario autenticado no existe");
  }

  return {
    id_usuario: Number(usuario.id_usuario),
    id_colaborador: Number(usuario.id_colaborador),
  };
}

async function getEstadoIdByName(nombre) {
  const estado = await Estado.findOne({
    where: {
      estado: {
        [Op.like]: String(nombre ?? ""),
      },
    },
    attributes: ["id_estado"],
  });

  return estado ? Number(estado.id_estado) : null;
}

function buildSpecialDate(baseDate, year) {
  if (!baseDate) return null;

  const source = parseDateOnly(baseDate, "fecha_base");
  let date = dayjs(`${year}-${source.format("MM-DD")}`, "YYYY-MM-DD", true);

  if (!date.isValid()) {
    date = dayjs(`${year}-02-28`, "YYYY-MM-DD", true);
  }

  return date;
}

function createBaseEvent({ id, type, title, startDate, endDate }) {
  return {
    id,
    type,
    title,
    start_date: String(startDate),
    end_date: String(endDate),
  };
}

function mapTipoIncapacidad(tipo) {
  const normalized = String(tipo ?? "").trim();
  return normalized || "Incapacidad";
}

export async function getCalendarioEventosByToken({ tokenId, from, to }) {
  const actor = await resolveActorFromToken(tokenId);

  const defaultRange = buildDefaultRange();
  const fromDate = from ? parseDateOnly(from, "from") : defaultRange.from;
  const toDate = to ? parseDateOnly(to, "to") : defaultRange.to;

  if (toDate.isBefore(fromDate)) {
    throw new Error("El rango de fechas es inválido: 'to' debe ser mayor o igual a 'from'");
  }

  const fromStr = fromDate.format("YYYY-MM-DD");
  const toStr = toDate.format("YYYY-MM-DD");
  const todayStr = dayjs().format("YYYY-MM-DD");

  const colaborador = await Colaborador.findByPk(actor.id_colaborador, {
    attributes: [
      "id_colaborador",
      "nombre",
      "primer_apellido",
      "segundo_apellido",
      "fecha_nacimiento",
    ],
  });

  if (!colaborador) {
    throw new Error("No se encontró el colaborador autenticado");
  }

  const estadoAprobadoId = await getEstadoIdByName("APROBADO");
  const estadoActivoId = await getEstadoIdByName("ACTIVO");

  const contratos = await Contrato.findAll({
    where: { id_colaborador: actor.id_colaborador },
    attributes: ["id_contrato", "fecha_inicio", "estado"],
    order: [["fecha_inicio", "ASC"], ["id_contrato", "ASC"]],
  });

  const fechaIngreso = contratos[0]?.fecha_inicio ?? null;

  const contratosActivos = estadoActivoId
    ? contratos.filter((contrato) => Number(contrato.estado) === Number(estadoActivoId))
    : [];

  const contratoReferencia =
    (contratosActivos.length > 0 ? contratosActivos[contratosActivos.length - 1] : contratos[contratos.length - 1]) ?? null;

  let horario = null;
  if (contratoReferencia) {
    horario = await HorarioLaboral.findOne({
      where: {
        id_contrato: Number(contratoReferencia.id_contrato),
        ...(estadoActivoId ? { estado: estadoActivoId } : {}),
      },
      order: [["fecha_actualizacion", "DESC"], ["id_horario", "DESC"]],
      attributes: ["dias_laborales"],
    });

    if (!horario) {
      horario = await HorarioLaboral.findOne({
        where: { id_contrato: Number(contratoReferencia.id_contrato) },
        order: [["fecha_actualizacion", "DESC"], ["id_horario", "DESC"]],
        attributes: ["dias_laborales"],
      });
    }
  }

  const workdaySet = normalizeDayCodes(horario?.dias_laborales ?? "");

  const [solicitudesPermisos, solicitudesVacaciones, jornadasIncapacidades] = await Promise.all([
    SolicitudPermisos.findAll({
      where: {
        id_colaborador: actor.id_colaborador,
        ...(estadoAprobadoId ? { estado_solicitud: estadoAprobadoId } : {}),
        fecha_inicio: { [Op.lte]: toStr },
        fecha_fin: { [Op.gte]: fromStr },
      },
      attributes: ["id_solicitud", "fecha_inicio", "fecha_fin", "con_goce_salarial"],
      order: [["fecha_inicio", "ASC"], ["id_solicitud", "ASC"]],
    }),
    SolicitudVacaciones.findAll({
      where: {
        id_colaborador: actor.id_colaborador,
        ...(estadoAprobadoId ? { estado_solicitud: estadoAprobadoId } : {}),
        fecha_inicio: { [Op.lte]: toStr },
        fecha_fin: { [Op.gte]: fromStr },
      },
      attributes: ["id_solicitud_vacaciones", "fecha_inicio", "fecha_fin"],
      order: [["fecha_inicio", "ASC"], ["id_solicitud_vacaciones", "ASC"]],
    }),
    JornadaDiaria.findAll({
      where: {
        id_colaborador: actor.id_colaborador,
        incapacidad: { [Op.ne]: null },
        fecha: { [Op.between]: [fromStr, toStr] },
      },
      attributes: ["fecha", "incapacidad"],
      include: [
        {
          association: "incapacidadRef",
          required: true,
          attributes: ["id_incapacidad", "fecha_inicio", "fecha_fin"],
          where: {
            fecha_fin: { [Op.gte]: todayStr },
          },
          include: [
            {
              association: "tipo",
              attributes: ["nombre"],
            },
          ],
        },
      ],
      order: [["fecha", "ASC"], ["id_jornada", "ASC"]],
    }),
  ]);

  const events = [];

  for (const permiso of solicitudesPermisos) {
    events.push(
      createBaseEvent({
        id: `permiso-${permiso.id_solicitud}`,
        type: "permiso",
        title: "Permiso aprobado",
        startDate: permiso.fecha_inicio,
        endDate: permiso.fecha_fin,
      })
    );
  }

  for (const vacacion of solicitudesVacaciones) {
    events.push(
      createBaseEvent({
        id: `vacaciones-${vacacion.id_solicitud_vacaciones}`,
        type: "vacaciones",
        title: "Vacaciones aprobadas",
        startDate: vacacion.fecha_inicio,
        endDate: vacacion.fecha_fin,
      })
    );
  }

  const incapacidadMap = new Map();
  for (const jornada of jornadasIncapacidades) {
    const plain = jornada.get({ plain: true });
    const incapacidad = plain.incapacidadRef;
    if (!incapacidad) continue;

    const id = Number(incapacidad.id_incapacidad);
    if (!Number.isInteger(id)) continue;

    if (!incapacidadMap.has(id)) {
      incapacidadMap.set(id, {
        id,
        startDate: String(incapacidad.fecha_inicio),
        endDate: String(incapacidad.fecha_fin),
        tipo: mapTipoIncapacidad(incapacidad.tipo?.nombre),
      });
    }
  }

  for (const incapacidad of incapacidadMap.values()) {
    if (!overlapsRange(incapacidad.startDate, incapacidad.endDate, fromStr, toStr)) continue;

    events.push(
      createBaseEvent({
        id: `incapacidad-${incapacidad.id}`,
        type: "incapacidad",
        title: `Incapacidad: ${incapacidad.tipo}`,
        startDate: incapacidad.startDate,
        endDate: incapacidad.endDate,
      })
    );
  }

  const rangeYears = new Set([fromDate.year(), toDate.year()]);

  for (const year of rangeYears) {
    const cumpleDate = buildSpecialDate(colaborador.fecha_nacimiento, year);
    if (cumpleDate && (cumpleDate.isAfter(fromDate) || cumpleDate.isSame(fromDate)) && (cumpleDate.isBefore(toDate) || cumpleDate.isSame(toDate))) {
      events.push(
        createBaseEvent({
          id: `cumple-${year}`,
          type: "cumpleanios",
          title: "Cumpleaños",
          startDate: cumpleDate.format("YYYY-MM-DD"),
          endDate: cumpleDate.format("YYYY-MM-DD"),
        })
      );
    }

    const aniversarioDate = buildSpecialDate(fechaIngreso, year);
    if (aniversarioDate && (aniversarioDate.isAfter(fromDate) || aniversarioDate.isSame(fromDate)) && (aniversarioDate.isBefore(toDate) || aniversarioDate.isSame(toDate))) {
      events.push(
        createBaseEvent({
          id: `aniversario-${year}`,
          type: "aniversario",
          title: "Aniversario en la empresa",
          startDate: aniversarioDate.format("YYYY-MM-DD"),
          endDate: aniversarioDate.format("YYYY-MM-DD"),
        })
      );
    }
  }

  const days = listDatesInclusive(fromDate, toDate).map((date) => {
    const dayCode = getDayCode(date);
    const isWorkday = workdaySet.has(dayCode);

    return {
      date,
      is_workday: isWorkday,
      event_types: [],
      event_labels: [],
      top_event_type: isWorkday ? "laboral" : null,
    };
  });

  const daysMap = new Map(days.map((day) => [day.date, day]));

  for (const event of events) {
    const eventStart = parseDateOnly(event.start_date, "event.start_date");
    const eventEnd = parseDateOnly(event.end_date, "event.end_date");

    const effectiveStart = eventStart.isBefore(fromDate) ? fromDate : eventStart;
    const effectiveEnd = eventEnd.isAfter(toDate) ? toDate : eventEnd;

    const coveredDates = listDatesInclusive(effectiveStart, effectiveEnd);

    for (const date of coveredDates) {
      const day = daysMap.get(date);
      if (!day) continue;

      if (!day.event_types.includes(event.type)) {
        day.event_types.push(event.type);
      }
      day.event_labels.push(event.title);
    }
  }

  for (const day of days) {
    day.top_event_type = getTopType(day.event_types, day.is_workday);
  }

  const upcomingEvent = events
    .filter((event) => String(event.end_date) >= todayStr)
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)))[0] ?? null;

  const colaboradorPlain = colaborador.get({ plain: true });

  return {
    range: {
      from: fromStr,
      to: toStr,
      today: todayStr,
    },
    collaborator: {
      id_colaborador: Number(colaboradorPlain.id_colaborador),
      nombre: colaboradorPlain.nombre,
      primer_apellido: colaboradorPlain.primer_apellido,
      segundo_apellido: colaboradorPlain.segundo_apellido,
      fecha_nacimiento: colaboradorPlain.fecha_nacimiento,
      fecha_ingreso: fechaIngreso,
      dias_laborales: horario?.dias_laborales ?? "",
    },
    events: events.sort((a, b) => String(a.start_date).localeCompare(String(b.start_date))),
    days,
    upcoming_event: upcomingEvent,
  };
}
