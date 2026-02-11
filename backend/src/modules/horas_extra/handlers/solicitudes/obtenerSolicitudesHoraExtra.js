import { Op } from "sequelize";
import {
  SolicitudHoraExtra,
  TipoHoraExtra,
  Estado,
  Colaborador,
} from "../../../../models/index.js";

const AGRUPAMIENTOS_PERMITIDOS = ["fecha_solicitud", "estado", "id_colaborador"];
const PRIORIDAD_ESTADOS = { PENDIENTE: 0, APROBADO: 1, RECHAZADO: 2, CANCELADO: 3 };

export const obtenerSolicitudesHoraExtra = async ({ agrupamiento, estado, id_colaborador } = {}) => {
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
      fecha_solicitud: row.fecha_solicitud,
      fecha_trabajo: row.fecha_trabajo,
      horas_solicitadas: String(row.horas_solicitadas),
      justificacion: row.justificacion,
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

  const gruposPorClave = new Map();

  for (const item of items) {
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
