import { Colaborador, Estado, SolicitudHoraExtra, SolicitudPermisos, SolicitudVacaciones, TipoHoraExtra } from "../../../models/index.js";

const RUTAS_DESTINO = {
  HORA_EXTRA: "/horas-extra/gestion",
  VACACIONES: "/vacaciones/gestion",
  PERMISO: "/permisos/gestion",
};

const ETIQUETAS_TIPO = {
  HORA_EXTRA: "Horas extra",
  VACACIONES: "Vacaciones",
  PERMISO: "Permisos",
};

function buildFullName(colaborador) {
  return [colaborador?.nombre, colaborador?.primer_apellido, colaborador?.segundo_apellido]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function buildHoraExtraDescription(row) {
  const cantidad = Number(row?.horas_solicitadas ?? 0);
  const horasLabel = Number.isFinite(cantidad)
    ? `${cantidad} ${cantidad === 1 ? "hora" : "horas"}`
    : "Horas extra";
  const tipoNombre = row?.tipoHoraExtra?.nombre ? String(row.tipoHoraExtra.nombre).trim() : "hora extra";
  return `${horasLabel} para ${row.fecha_trabajo} (${tipoNombre})`;
}

function buildVacacionesDescription(row) {
  return `Vacaciones del ${row.fecha_inicio} al ${row.fecha_fin}`;
}

function buildPermisoDescription(row) {
  const conGoce = row?.con_goce_salarial ? "con goce salarial" : "sin goce salarial";
  return `Permiso ${conGoce} del ${row.fecha_inicio} al ${row.fecha_fin}`;
}

async function resolvePendingStatus() {
  const estadoPendiente = await Estado.findOne({
    where: { estado: "PENDIENTE" },
    attributes: ["id_estado", "estado"],
  });

  if (!estadoPendiente) {
    const error = new Error('No se encontró el estado "PENDIENTE"');
    error.statusCode = 500;
    throw error;
  }

  return estadoPendiente;
}

export async function obtenerPendientesAprobacion({ id_aprobador }) {
  const numericIdAprobador = Number(id_aprobador);

  if (!Number.isInteger(numericIdAprobador) || numericIdAprobador <= 0) {
    const error = new Error("id_aprobador debe ser un entero positivo");
    error.statusCode = 400;
    throw error;
  }

  const estadoPendiente = await resolvePendingStatus();
  const estadoId = Number(estadoPendiente.id_estado);
  const estadoNombre = String(estadoPendiente.estado ?? "PENDIENTE").toUpperCase();

  const [horasExtraRows, vacacionesRows, permisosRows] = await Promise.all([
    SolicitudHoraExtra.findAll({
      where: {
        id_aprobador: numericIdAprobador,
        estado: estadoId,
      },
      include: [
        {
          model: Colaborador,
          as: "colaborador",
          attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
          required: true,
        },
        {
          model: TipoHoraExtra,
          as: "tipoHoraExtra",
          attributes: ["id_tipo_hx", "nombre"],
          required: false,
        },
      ],
      order: [["fecha_solicitud", "DESC"], ["id_solicitud_hx", "DESC"]],
    }),
    SolicitudVacaciones.findAll({
      where: {
        id_aprobador: numericIdAprobador,
        estado_solicitud: estadoId,
      },
      include: [
        {
          model: Colaborador,
          as: "colaborador",
          attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
          required: true,
        },
      ],
      order: [["fecha_inicio", "DESC"], ["id_solicitud_vacaciones", "DESC"]],
    }),
    SolicitudPermisos.findAll({
      where: {
        id_aprobador: numericIdAprobador,
        estado_solicitud: estadoId,
      },
      include: [
        {
          model: Colaborador,
          as: "colaborador",
          attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
          required: true,
        },
      ],
      order: [["fecha_inicio", "DESC"], ["id_solicitud", "DESC"]],
    }),
  ]);

  const items = [
    ...horasExtraRows.map((row) => ({
      id_solicitud: Number(row.id_solicitud_hx),
      tipo_solicitud: "HORA_EXTRA",
      tipo_label: ETIQUETAS_TIPO.HORA_EXTRA,
      nombre_solicitante: buildFullName(row.colaborador) || `Colaborador ${row.id_colaborador}`,
      id_colaborador_solicitante: Number(row.id_colaborador),
      id_aprobador: Number(row.id_aprobador),
      estado: estadoNombre,
      fecha_principal: row.fecha_trabajo,
      fecha_fin: null,
      fecha_orden: row.fecha_solicitud,
      descripcion: buildHoraExtraDescription(row),
      ruta_destino: RUTAS_DESTINO.HORA_EXTRA,
    })),
    ...vacacionesRows.map((row) => ({
      id_solicitud: Number(row.id_solicitud_vacaciones),
      tipo_solicitud: "VACACIONES",
      tipo_label: ETIQUETAS_TIPO.VACACIONES,
      nombre_solicitante: buildFullName(row.colaborador) || `Colaborador ${row.id_colaborador}`,
      id_colaborador_solicitante: Number(row.id_colaborador),
      id_aprobador: Number(row.id_aprobador),
      estado: estadoNombre,
      fecha_principal: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      fecha_orden: row.fecha_inicio,
      descripcion: buildVacacionesDescription(row),
      ruta_destino: RUTAS_DESTINO.VACACIONES,
    })),
    ...permisosRows.map((row) => ({
      id_solicitud: Number(row.id_solicitud),
      tipo_solicitud: "PERMISO",
      tipo_label: ETIQUETAS_TIPO.PERMISO,
      nombre_solicitante: buildFullName(row.colaborador) || `Colaborador ${row.id_colaborador}`,
      id_colaborador_solicitante: Number(row.id_colaborador),
      id_aprobador: Number(row.id_aprobador),
      estado: estadoNombre,
      fecha_principal: row.fecha_inicio,
      fecha_fin: row.fecha_fin,
      fecha_orden: row.fecha_inicio,
      descripcion: buildPermisoDescription(row),
      ruta_destino: RUTAS_DESTINO.PERMISO,
    })),
  ].sort((a, b) => String(b.fecha_orden ?? "").localeCompare(String(a.fecha_orden ?? "")));

  return {
    total_pendientes: items.length,
    items,
  };
}
