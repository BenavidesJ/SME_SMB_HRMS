import { Op } from "sequelize";
import {
  SolicitudPermisos,
  Colaborador,
  Estado,
  JornadaDiaria,
  Contrato,
  HorarioLaboral,
} from "../../../models/index.js";
import {
  assertId,
  assertDate,
  listDatesInclusive,
  fetchEstadoId,
  splitDatesBySchedule,
} from "../../vacaciones/handlers/utils/vacacionesUtils.js";

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

export async function listarPermisosPorColaborador({ id_colaborador, aprobador_filter }) {
  const idColaborador = assertId(id_colaborador, "id_colaborador");
  const aprobadorFilter = aprobador_filter ? assertId(aprobador_filter, "aprobador_filter") : null;

  const solicitudes = await SolicitudPermisos.findAll({
    where: {
      id_colaborador: idColaborador,
      ...(aprobadorFilter ? { id_aprobador: { [Op.eq]: aprobadorFilter } } : {}),
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
    ],
    order: [
      ["fecha_inicio", "DESC"],
      ["id_solicitud", "DESC"],
    ],
  });

  if (solicitudes.length === 0) {
    return [];
  }

  const estadoActivoId = await fetchEstadoId({ nombre: "ACTIVO" });

  const contratoActivo = await Contrato.findOne({
    where: { id_colaborador: idColaborador, estado: estadoActivoId },
    order: [["fecha_inicio", "DESC"]],
  });

  const horarioActivo = contratoActivo
    ? await HorarioLaboral.findOne({
        where: { id_contrato: contratoActivo.id_contrato, estado: estadoActivoId },
        order: [["fecha_actualizacion", "DESC"]],
      })
    : null;

  const solicitudIds = solicitudes.map((row) => Number(row.id_solicitud));

  const jornadas = solicitudIds.length
    ? await JornadaDiaria.findAll({
        where: { permiso: { [Op.in]: solicitudIds } },
        attributes: ["permiso", "fecha"],
      })
    : [];

  const jornadasPorSolicitud = new Map();
  for (const jornada of jornadas) {
    const solicitudId = Number(jornada.permiso);
    if (!jornadasPorSolicitud.has(solicitudId)) {
      jornadasPorSolicitud.set(solicitudId, []);
    }
    jornadasPorSolicitud.get(solicitudId).push(String(jornada.fecha));
  }
  for (const fechas of jornadasPorSolicitud.values()) {
    fechas.sort();
  }

  return solicitudes.map((row) => {
    const plain = row.get({ plain: true });
    const estado = plain.estadoSolicitud ?? null;
    const estadoNombre = estado?.estado ? String(estado.estado).toUpperCase() : null;

    const startDate = assertDate(plain.fecha_inicio, "fecha_inicio");
    const endDate = assertDate(plain.fecha_fin, "fecha_fin");
    const requestedDates = listDatesInclusive(startDate, endDate);

    let workingDates = requestedDates;
    let restDates = [];
    if (horarioActivo) {
      const split = splitDatesBySchedule({ requestedDates, horario: horarioActivo });
      workingDates = split.workingDates;
      restDates = split.restDates;
    }

    const jornadasAsignadas = jornadasPorSolicitud.get(Number(plain.id_solicitud)) ?? [];
    const chargeableDates = estadoNombre === "APROBADO" ? jornadasAsignadas : workingDates;

    const skippedDetails = restDates
      .map((date) => ({ date, reason: "DESCANSO", holiday: null }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const tipoPermiso = plain.con_goce_salarial ? "GOCE" : "SIN_GOCE";
    const diasSolicitadosStr = String(chargeableDates.length);
    const isAprobado = estadoNombre === "APROBADO";

    return {
      id_solicitud: Number(plain.id_solicitud),
      id_colaborador: Number(plain.id_colaborador),
      id_aprobador: Number(plain.id_aprobador),
      fecha_inicio: String(plain.fecha_inicio),
      fecha_fin: String(plain.fecha_fin),
      estado_solicitud: estado?.estado ?? null,
      estadoSolicitudPermisos: estado
        ? {
            id_estado: Number(estado.id_estado),
            estado: estado.estado,
          }
        : null,
      con_goce_salarial: Boolean(plain.con_goce_salarial),
      cantidad_dias: plain.cantidad_dias != null ? String(plain.cantidad_dias) : diasSolicitadosStr,
      cantidad_horas: plain.cantidad_horas != null ? String(plain.cantidad_horas) : null,
      tipo_permiso: tipoPermiso,
      tiposSolicitud: {
        id_tipo_solicitud: null,
        tipo_solicitud: tipoPermiso === "GOCE" ? "Con goce salarial" : "Sin goce salarial",
        es_permiso: true,
        es_licencia: false,
      },
      dias_solicitados: diasSolicitadosStr,
      dias_aprobados: isAprobado ? diasSolicitadosStr : null,
      dias_solicitados_detalle: chargeableDates,
      dias_skipped_detalle: skippedDetails,
      colaborador: toColaboradorResumen(plain.colaborador),
      aprobador: toColaboradorResumen(plain.aprobador),
      meta_permiso: {
        chargeableDates,
        skippedDates: skippedDetails,
      },
    };
  });
}
