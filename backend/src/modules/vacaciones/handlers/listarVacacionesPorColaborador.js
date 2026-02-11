import { Op } from "sequelize";
import {
  SolicitudVacaciones,
  Colaborador,
  Estado,
  SaldoVacaciones,
  JornadaDiaria,
  Contrato,
  HorarioLaboral,
  Feriado,
} from "../../../models/index.js";
import {
  assertId,
  assertDate,
  listDatesInclusive,
  fetchEstadoId,
  splitDatesBySchedule,
} from "./utils/vacacionesUtils.js";

function toColaboradorResumen(row) {
  if (!row) return null;
  const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
  return {
    id_colaborador: Number(plain.id_colaborador),
    nombre: plain.nombre ?? null,
    primer_apellido: plain.primer_apellido ?? null,
    segundo_apellido: plain.segundo_apellido ?? null,
    correo_electronico: plain.correo_electronico ?? null,
  };
}

export async function listarVacacionesPorColaborador({
  id_colaborador,
  aprobador_filter,
}) {
  const idColaborador = assertId(id_colaborador, "id_colaborador");
  const aprobadorFilter = aprobador_filter
    ? assertId(aprobador_filter, "aprobador_filter")
    : null;

  const solicitudes = await SolicitudVacaciones.findAll({
    where: {
      id_colaborador: idColaborador,
      ...(aprobadorFilter
        ? { id_aprobador: { [Op.eq]: aprobadorFilter } }
        : {}),
    },
    include: [
      {
        model: Estado,
        as: "estadoSolicitud",
        attributes: ["id_estado", "estado"],
      },
      {
        model: Colaborador,
        as: "colaborador",
        attributes: [
          "id_colaborador",
          "nombre",
          "primer_apellido",
          "segundo_apellido",
          "correo_electronico",
        ],
      },
      {
        model: Colaborador,
        as: "aprobador",
        attributes: [
          "id_colaborador",
          "nombre",
          "primer_apellido",
          "segundo_apellido",
          "correo_electronico",
        ],
      },
      {
        model: SaldoVacaciones,
        as: "saldoVacaciones",
        attributes: ["id_saldo_vac", "dias_ganados", "dias_tomados"],
      },
    ],
    order: [
      ["fecha_inicio", "DESC"],
      ["id_solicitud_vacaciones", "DESC"],
    ],
  });

  const allRequestedDates = new Set();
  const solicitudIds = solicitudes.map((row) =>
    Number(row.id_solicitud_vacaciones)
  );
  const estadoActivoId = await fetchEstadoId({ nombre: "ACTIVO" });

  const contratoActivo = estadoActivoId
    ? await Contrato.findOne({
        where: { id_colaborador: idColaborador, estado: estadoActivoId },
        order: [["fecha_inicio", "DESC"]],
      })
    : null;

  const horarioActivo = contratoActivo
    ? await HorarioLaboral.findOne({
        where: { id_contrato: contratoActivo.id_contrato, estado: estadoActivoId },
        order: [["fecha_actualizacion", "DESC"]],
      })
    : null;

  for (const row of solicitudes) {
    const plain = row.get({ plain: true });
    const startDate = assertDate(plain.fecha_inicio, "fecha_inicio");
    const endDate = assertDate(plain.fecha_fin, "fecha_fin");
    listDatesInclusive(startDate, endDate).forEach((date) =>
      allRequestedDates.add(date)
    );
  }

  const jornadas = solicitudIds.length
    ? await JornadaDiaria.findAll({
        where: { vacaciones: { [Op.in]: solicitudIds } },
        attributes: ["vacaciones", "fecha"],
      })
    : [];

  const jornadasPorSolicitud = new Map();
  for (const jornada of jornadas) {
    const solicitudId = Number(jornada.vacaciones);
    if (!jornadasPorSolicitud.has(solicitudId)) {
      jornadasPorSolicitud.set(solicitudId, []);
    }
    jornadasPorSolicitud.get(solicitudId).push(String(jornada.fecha));
  }
  for (const fechas of jornadasPorSolicitud.values()) {
    fechas.sort();
  }

  const feriados = allRequestedDates.size
    ? await Feriado.findAll({
        where: { fecha: { [Op.in]: Array.from(allRequestedDates) } },
        attributes: ["fecha", "nombre"],
      })
    : [];

  const feriadosPorFecha = new Map();
  for (const feriado of feriados) {
    feriadosPorFecha.set(String(feriado.fecha), {
      fecha: String(feriado.fecha),
      nombre: feriado.nombre ?? null,
    });
  }

  return solicitudes.map((row) => {
    const plain = row.get({ plain: true });
    const estado = plain.estadoSolicitud ?? null;
    const estadoNombre = (estado?.estado ?? null)
      ? String(estado.estado).toUpperCase()
      : null;

    const startDate = assertDate(plain.fecha_inicio, "fecha_inicio");
    const endDate = assertDate(plain.fecha_fin, "fecha_fin");
    const requestedDates = listDatesInclusive(startDate, endDate);

    let workingDates = requestedDates;
    let restDates = [];
    if (horarioActivo) {
      const split = splitDatesBySchedule({
        requestedDates,
        horario: horarioActivo,
      });
      workingDates = split.workingDates;
      restDates = split.restDates;
    }

    const feriadosEnSolicitud = requestedDates.filter((date) =>
      feriadosPorFecha.has(date)
    );

    const jornadasAsignadas =
      jornadasPorSolicitud.get(Number(plain.id_solicitud_vacaciones)) ?? [];

    const chargeableDates =
      estadoNombre === "APROBADO"
        ? jornadasAsignadas
        : workingDates.filter((date) => !feriadosPorFecha.has(date));

    const skippedDetailsMap = new Map();
    for (const date of restDates) {
      skippedDetailsMap.set(date, {
        date,
        reason: "DESCANSO",
        holiday: null,
      });
    }
    for (const date of feriadosEnSolicitud) {
      skippedDetailsMap.set(date, {
        date,
        reason: "FERIADO",
        holiday: feriadosPorFecha.get(date)?.nombre ?? null,
      });
    }

    const skippedDetails = Array.from(skippedDetailsMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const diasSolicitadosStr = String(chargeableDates.length);
    const isAprobado = estadoNombre === "APROBADO";

    return {
      id_solicitud_vacaciones: Number(plain.id_solicitud_vacaciones),
      id_colaborador: Number(plain.id_colaborador),
      id_aprobador: Number(plain.id_aprobador),
      fecha_inicio: String(plain.fecha_inicio),
      fecha_fin: String(plain.fecha_fin),
      estado_solicitud: estado?.estado ?? null,
      estadoSolicitudVacaciones: estado
        ? {
            id_estado: Number(estado.id_estado),
            estado: estado.estado,
          }
        : null,
      dias_solicitados: diasSolicitadosStr,
      dias_aprobados: isAprobado ? diasSolicitadosStr : null,
      dias_solicitados_detalle: chargeableDates,
      dias_skipped_detalle: skippedDetails,
      colaborador: toColaboradorResumen(plain.colaborador),
      aprobador: toColaboradorResumen(plain.aprobador),
      saldo_vacaciones: plain.saldoVacaciones
        ? {
            dias_ganados: Number(plain.saldoVacaciones.dias_ganados),
            dias_tomados: Number(plain.saldoVacaciones.dias_tomados),
          }
        : null,
      meta_vacaciones: {
        chargeableDates,
        skippedDates: skippedDetails,
      },
    };
  });
}
