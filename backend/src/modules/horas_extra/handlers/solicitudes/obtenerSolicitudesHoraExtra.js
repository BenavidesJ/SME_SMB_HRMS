import { Op } from "sequelize";
import {
  SolicitudHoraExtra,
  TipoHoraExtra,
  Estado,
  Colaborador,
  Feriado,
  Contrato,
  HorarioLaboral,
} from "../../../../models/index.js";
import { getDayInitial } from "../../../asistencia/handlers/helpers/obtenerInicialDia.js";

const AGRUPAMIENTOS_PERMITIDOS = ["fecha_solicitud", "estado", "id_colaborador"];
const PRIORIDAD_ESTADOS = { PENDIENTE: 0, APROBADO: 1, RECHAZADO: 2, CANCELADO: 3 };

export const obtenerSolicitudesHoraExtra = async ({ agrupamiento, estado, id_colaborador, id_aprobador } = {}) => {
  const agr = String(agrupamiento ?? "fecha_solicitud").trim().toLowerCase();

  if (!AGRUPAMIENTOS_PERMITIDOS.includes(agr)) {
    const err = new Error(`Agrupamiento inválido. Use uno de: ${AGRUPAMIENTOS_PERMITIDOS.join(", ")}`);
    err.statusCode = 400;
    throw err;
  }

  const where = {};

  if (id_colaborador !== undefined && id_colaborador !== null && String(id_colaborador).trim() !== "") {
    const idColab = Number(String(id_colaborador).trim());
    if (!Number.isFinite(idColab)) {
      const err = new Error("id_colaborador debe ser numérico");
      err.statusCode = 400;
      throw err;
    }
    where.id_colaborador = idColab;
  }

  if (id_aprobador !== undefined && id_aprobador !== null && String(id_aprobador).trim() !== "") {
    const idAprobador = Number(String(id_aprobador).trim());
    if (!Number.isFinite(idAprobador)) {
      const err = new Error("id_aprobador debe ser numérico");
      err.statusCode = 400;
      throw err;
    }
    where.id_aprobador = idAprobador;
  }

  const filtroEstadoTxt = String(estado ?? "").trim().toUpperCase();
  const includeEstado = {
    model: Estado,
    as: "estadoRef",
    attributes: ["id_estado", "estado"],
    required: true,
    ...(filtroEstadoTxt ? { where: { estado: { [Op.eq]: filtroEstadoTxt } } } : {}),
  };

  const rows = await SolicitudHoraExtra.findAll({
    where,
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        attributes: [
          "id_colaborador",
          "correo_electronico",
          "nombre",
          "primer_apellido",
          "segundo_apellido",
        ],
        required: true,
      },
      {
        model: TipoHoraExtra,
        as: "tipoHoraExtra",
        attributes: ["id_tipo_hx", "nombre", "multiplicador"],
        required: true,
      },
      includeEstado,
    ],
    order: [
      ["fecha_solicitud", "DESC"],
      ["id_solicitud_hx", "DESC"],
    ],
  });

  const items = rows.map((row) => {
    const colab = row?.colaborador;
    const tipo = row?.tipoHoraExtra;
    const est = row?.estadoRef;

    const nombreCompleto = colab
      ? `${colab.nombre ?? ""} ${colab.primer_apellido ?? ""} ${colab.segundo_apellido ?? ""}`.trim()
      : "N/A";

    return {
      id_solicitud_hx: row.id_solicitud_hx,
      id_aprobador: row.id_aprobador,
      fecha_solicitud: row.fecha_solicitud,
      fecha_trabajo: row.fecha_trabajo,
      horas_solicitadas: String(row.horas_solicitadas),
      tipo_hx: {
        id: tipo?.id_tipo_hx,
        nombre: tipo?.nombre,
        multiplicador: tipo ? String(tipo.multiplicador) : null,
      },
      estado: {
        id: est?.id_estado,
        estado: est?.estado,
      },
      colaborador: {
        id: colab?.id_colaborador,
        nombre_completo: nombreCompleto,
        correo: colab?.correo_electronico,
      },
    };
  });

  // ── Enriquecimiento con tipo_dia (batch, sin N+1) ────────────────────────
  const uniqueFechas = [...new Set(items.map((it) => String(it.fecha_trabajo)))];
  const uniqueColabIds = [...new Set(items.map((it) => Number(it.colaborador?.id)).filter(Boolean))];

  const feriadoMap = new Map();
  if (uniqueFechas.length > 0) {
    const feriados = await Feriado.findAll({
      where: { fecha: { [Op.in]: uniqueFechas } },
      attributes: ["fecha", "nombre"],
    });
    for (const f of feriados) {
      feriadoMap.set(String(f.fecha), String(f.nombre));
    }
  }

  const horarioMap = new Map();
  if (uniqueColabIds.length > 0) {
    const estadoActivoRec = await Estado.findOne({
      where: { estado: "ACTIVO" },
      attributes: ["id_estado"],
    });

    if (estadoActivoRec) {
      const contratos = await Contrato.findAll({
        where: {
          id_colaborador: { [Op.in]: uniqueColabIds },
          estado: estadoActivoRec.id_estado,
        },
        attributes: ["id_contrato", "id_colaborador"],
        include: [
          {
            model: HorarioLaboral,
            as: "horarios",
            where: { estado: estadoActivoRec.id_estado },
            attributes: ["hora_inicio", "dias_libres"],
            required: false,
          },
        ],
      });

      for (const c of contratos) {
        const horario = Array.isArray(c.horarios) ? c.horarios[0] ?? null : null;
        horarioMap.set(Number(c.id_colaborador), {
          hora_inicio: horario?.hora_inicio ?? null,
          dias_libres: horario?.dias_libres ?? "",
        });
      }
    }
  }

  const itemsEnriquecidos = items.map((it) => {
    const fechaStr = String(it.fecha_trabajo);
    const colabId = Number(it.colaborador?.id);

    let tipo_dia = "LABORAL";
    let nombre_feriado = null;

    if (feriadoMap.has(fechaStr)) {
      tipo_dia = "FERIADO";
      nombre_feriado = feriadoMap.get(fechaStr);
    } else {
      const horarioInfo = horarioMap.get(colabId);
      if (horarioInfo) {
        const dayInit = getDayInitial(new Date(fechaStr + "T12:00:00"));
        if (String(horarioInfo.dias_libres).includes(dayInit)) {
          tipo_dia = "DESCANSO";
        }
      }
    }

    return { ...it, tipo_dia, nombre_feriado };
  });

  if (agr === "fecha_solicitud") {
    return {
      agrupamiento: "fecha_solicitud",
      total: itemsEnriquecidos.length,
      items: itemsEnriquecidos,
    };
  }

  const gruposPorClave = new Map();

  for (const item of itemsEnriquecidos) {
    let clave;
    let etiqueta;

    if (agr === "estado") {
      clave = item.estado?.estado ?? "N/A";
      etiqueta = item.estado?.estado ?? "N/A";
    } else {
      clave = item.colaborador?.id ?? "N/A";
      etiqueta = item.colaborador?.nombre_completo ?? `Colaborador ${clave}`;
    }

    if (!gruposPorClave.has(clave)) {
      gruposPorClave.set(clave, { clave, etiqueta, cantidad: 0, items: [] });
    }

    const grupo = gruposPorClave.get(clave);
    grupo.items.push(item);
    grupo.cantidad += 1;
  }

  const grupos = Array.from(gruposPorClave.values());

  if (agr === "estado") {
    grupos.sort((a, b) => {
      const pa = PRIORIDAD_ESTADOS[String(a.etiqueta).toUpperCase()] ?? 99;
      const pb = PRIORIDAD_ESTADOS[String(b.etiqueta).toUpperCase()] ?? 99;
      return pa - pb;
    });
  } else {
    grupos.sort((a, b) => String(a.etiqueta).localeCompare(String(b.etiqueta)));
  }

  return {
    agrupamiento: agr,
    total: items.length,
    grupos,
  };
};
