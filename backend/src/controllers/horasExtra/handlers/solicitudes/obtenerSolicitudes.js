import { Op } from "sequelize";
import {
  SolicitudHoraExtra,
  TipoHoraExtra,
  Estado,
  Colaborador,
} from "../../../../models/index.js";

/**
 * Obtener Solicitudes de Horas Extra
 *
 * @param {{
 *   agrupamiento?: "fecha_solicitud"|"estado"|"id_colaborador",
 *   estado?: string,
 *   id_colaborador?: number|string
 * }} params
 *
 * @returns {Promise<
 *   | { agrupamiento:"fecha_solicitud", total:number, items:Array<any> }
 *   | { agrupamiento:"estado"|"id_colaborador", total:number, grupos:Array<any> }
 * >}
 */
export const obtenerSolicitudesHoraExtra = async ({
  agrupamiento = "fecha_solicitud",
  estado,
  id_colaborador,
} = {}) => {
  const agr = String(agrupamiento ?? "fecha_solicitud").trim().toLowerCase();

  const permitidos = ["fecha_solicitud", "estado", "id_colaborador"];
  if (!permitidos.includes(agr)) {
    const err = new Error(
      `Agrupamiento inválido. Use uno de: ${permitidos.join(", ")}`
    );
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

  const filtroEstadoTxt = String(estado ?? "").trim().toUpperCase();
  const includeEstado = {
    model: Estado,
    as: "estadoSolicitudHoraExtra",
    attributes: ["id_estado", "estado"],
    required: true,
    ...(filtroEstadoTxt ? { where: { estado: { [Op.eq]: filtroEstadoTxt } } } : {}),
  };

  const rows = await SolicitudHoraExtra.findAll({
    where,
    include: [
      {
        model: Colaborador,
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

  const items = rows.map((r) => {
    const colab = r?.colaborador;
    const tipo = r?.tipo_hora_extra;
    const est = r?.estadoSolicitudHoraExtra;

    const nombreCompleto = colab
      ? `${colab.nombre ?? ""} ${colab.primer_apellido ?? ""} ${colab.segundo_apellido ?? ""}`.trim()
      : "N/A";

    return {
      id_solicitud_hx: r.id_solicitud_hx,
      fecha_solicitud: r.fecha_solicitud,
      fecha_trabajo: r.fecha_trabajo,
      horas_solicitadas: String(r.horas_solicitadas),
      justificacion: r.justificacion,
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

  if (agr === "fecha_solicitud") {
    return {
      agrupamiento: "fecha_solicitud",
      total: items.length,
      items,
    };
  }

  // Agrupamiento por estado o colaborador
  const mapaGrupos = new Map();

  for (const it of items) {
    let clave;
    let etiqueta;

    if (agr === "estado") {
      clave = it.estado?.estado ?? "N/A";
      etiqueta = it.estado?.estado ?? "N/A";
    } else {
      clave = it.colaborador?.id ?? "N/A";
      etiqueta = it.colaborador?.nombre_completo ?? `Colaborador ${clave}`;
    }

    if (!mapaGrupos.has(clave)) {
      mapaGrupos.set(clave, { clave, etiqueta, cantidad: 0, items: [] });
    }

    const g = mapaGrupos.get(clave);
    g.items.push(it);
    g.cantidad += 1;
  }

  const grupos = Array.from(mapaGrupos.values());

  if (agr === "estado") {
    const prioridad = { PENDIENTE: 0, APROBADA: 1, RECHAZADA: 2 };
    grupos.sort((a, b) => {
      const pa = prioridad[String(a.etiqueta).toUpperCase()] ?? 99;
      const pb = prioridad[String(b.etiqueta).toUpperCase()] ?? 99;
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
