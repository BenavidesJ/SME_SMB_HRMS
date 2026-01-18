import dayjs from "dayjs";
import { Op } from "sequelize";
import {
  sequelize,
  SolicitudHoraExtra,
  TipoHoraExtra,
  Contrato,
  TipoJornada,
  Estado,
  Colaborador,
} from "../../../../models/index.js";
import { sendEmail } from "../../../../services/mail.js";
import { plantillaNotificacionSolicitud } from "../../../../common/plantillasEmail/notificacionesSolicitudes.js";

/**
 * Actualizar Solicitud de Horas Extra : editar / aprobar / rechazar / cancelar
 */
export const modificarSolicitudHoraExtra = async ({
  id_solicitud_hx,
  id_aprobador,
  fecha_trabajo,
  horas_solicitadas,
  id_tipo_hx,
  justificacion,
  estado,
  horas_aprobadas,
}) => {
  const tx = await sequelize.transaction();

  let notificarColaborador = false;
  let correoColaborador = null;
  let subjectCorreo = null;
  let htmlCorreo = null;

  try {
    const id = Number(String(id_solicitud_hx).trim());
    if (!Number.isFinite(id)) throw new Error("id_solicitud_hx debe ser numérico");

    const current = await SolicitudHoraExtra.findByPk(id, { transaction: tx });
    if (!current) {
      const err = new Error(`No existe solicitud de horas extra con id ${id}`);
      err.statusCode = 404;
      throw err;
    }

    const estadoActual = await Estado.findByPk(current.estado, {
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });

    const estadoAnteriorTxt = String(estadoActual?.estado ?? "").toUpperCase();

    const nuevoEstadoTxt = String(estado ?? "").trim().toUpperCase();
    const quiereCambiarEstado = Boolean(nuevoEstadoTxt);

    const estadosPermitidos = ["PENDIENTE", "APROBADO", "RECHAZADO", "CANCELADO"];
    if (quiereCambiarEstado && !estadosPermitidos.includes(nuevoEstadoTxt)) {
      const err = new Error(`Estado inválido. Use uno de: ${estadosPermitidos.join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    if (estadoAnteriorTxt !== "PENDIENTE") {
      const err = new Error(
        `La solicitud no se puede modificar porque su estado actual es ${estadoAnteriorTxt}`
      );
      err.statusCode = 409;
      throw err;
    }

    const patch = {};

    let fechaTrabajoFinal = current.fecha_trabajo;
    if (fecha_trabajo !== undefined) {
      const fechaTxt = String(fecha_trabajo ?? "").trim();
      if (!fechaTxt) {
        const err = new Error("fecha_trabajo no puede ser vacía");
        err.statusCode = 400;
        throw err;
      }
      if (!dayjs(fechaTxt, "YYYY-MM-DD", true).isValid()) {
        const err = new Error("fecha_trabajo debe tener formato YYYY-MM-DD");
        err.statusCode = 400;
        throw err;
      }
      fechaTrabajoFinal = fechaTxt;
      patch.fecha_trabajo = fechaTxt;
    }

    let horasFinal = Number(current.horas_solicitadas);
    if (horas_solicitadas !== undefined) {
      const horas = Number(String(horas_solicitadas).trim());
      if (!Number.isFinite(horas) || horas <= 0) {
        const err = new Error("horas_solicitadas debe ser un número mayor a 0");
        err.statusCode = 400;
        throw err;
      }
      horasFinal = horas;
      patch.horas_solicitadas = horas;
    }

    let tipoHx = null;

    if (id_tipo_hx !== undefined) {
      const idTipo = Number(String(id_tipo_hx).trim());
      if (!Number.isFinite(idTipo)) {
        const err = new Error("id_tipo_hx debe ser numérico");
        err.statusCode = 400;
        throw err;
      }

      const existsTipo = await TipoHoraExtra.findByPk(idTipo, {
        attributes: ["id_tipo_hx", "nombre", "multiplicador"],
        transaction: tx,
      });

      if (!existsTipo) {
        const err = new Error(`No existe tipo de hora extra con id ${idTipo}`);
        err.statusCode = 404;
        throw err;
      }

      patch.id_tipo_hx = idTipo;
      tipoHx = existsTipo;
    } else {
      tipoHx = await TipoHoraExtra.findByPk(current.id_tipo_hx, {
        attributes: ["id_tipo_hx", "nombre", "multiplicador"],
        transaction: tx,
      });
    }

    if (justificacion !== undefined) {
      const justi = String(justificacion ?? "").trim();
      if (!justi) {
        const err = new Error("justificacion es obligatoria");
        err.statusCode = 400;
        throw err;
      }
      if (justi.length > 100) {
        const err = new Error("justificacion no puede exceder 100 caracteres");
        err.statusCode = 400;
        throw err;
      }
      patch.justificacion = justi;
    }

    const estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });
    if (!estadoActivo) throw new Error(`No existe el estado "ACTIVO" en el catálogo estado`);
    const ESTADO_ACTIVO_ID = estadoActivo.id_estado;

    const contratoActivo = await Contrato.findOne({
      where: { id_colaborador: current.id_colaborador, estado: ESTADO_ACTIVO_ID },
      attributes: ["id_contrato", "id_tipo_jornada"],
      transaction: tx,
    });
    if (!contratoActivo) throw new Error("El colaborador no tiene un contrato ACTIVO");

    const tipoJornada = await TipoJornada.findByPk(contratoActivo.id_tipo_jornada, {
      attributes: ["id_tipo_jornada", "tipo", "max_horas_diarias", "max_horas_semanales"],
      transaction: tx,
    });
    if (!tipoJornada) throw new Error("El contrato activo no tiene un tipo de jornada válido");

    const maxDiarias = Number(tipoJornada.max_horas_diarias);
    if (!Number.isFinite(maxDiarias) || maxDiarias <= 0) {
      throw new Error("El tipo de jornada tiene max_horas_diarias inválido");
    }

    const totalDia = maxDiarias + horasFinal;
    if (totalDia > 12) {
      const err = new Error(
        `La solicitud excede el máximo diario permitido. Ordinarias(${maxDiarias}) + Extra(${horasFinal}) = ${totalDia} > 12`
      );
      err.statusCode = 409;
      throw err;
    }

    const maxExtraSegunJornada = 12 - maxDiarias;
    if (horasFinal > maxExtraSegunJornada) {
      const err = new Error(
        `Horas extra solicitadas exceden el máximo permitido para esta jornada. Máximo: ${maxExtraSegunJornada}`
      );
      err.statusCode = 409;
      throw err;
    }

    const estadoPendiente = await Estado.findOne({
      where: { estado: "PENDIENTE" },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });
    if (!estadoPendiente) throw new Error(`No existe el estado "PENDIENTE" en el catálogo estado`);
    const ESTADO_PENDIENTE_ID = estadoPendiente.id_estado;

    const duplicada = await SolicitudHoraExtra.findOne({
      where: {
        id_solicitud_hx: { [Op.ne]: id },
        id_colaborador: current.id_colaborador,
        fecha_trabajo: fechaTrabajoFinal,
        estado: ESTADO_PENDIENTE_ID,
      },
      attributes: ["id_solicitud_hx"],
      transaction: tx,
    });

    if (duplicada) {
      const err = new Error("Ya existe una solicitud de horas extra PENDIENTE para este día");
      err.statusCode = 409;
      throw err;
    }

    if (quiereCambiarEstado) {
      const estadoNuevo = await Estado.findOne({
        where: { estado: nuevoEstadoTxt },
        attributes: ["id_estado", "estado"],
        transaction: tx,
      });
      if (!estadoNuevo) {
        const err = new Error(`No existe el estado "${nuevoEstadoTxt}" en el catálogo estado`);
        err.statusCode = 404;
        throw err;
      }

      if (nuevoEstadoTxt === "APROBADO" || nuevoEstadoTxt === "RECHAZADO") {
        if (id_aprobador === undefined || id_aprobador === null || String(id_aprobador).trim() === "") {
          const err = new Error("El id del aprobador es obligatorio");
          err.statusCode = 400;
          throw err;
        }

        const aprobadorId = Number(String(id_aprobador).trim());
        if (!Number.isFinite(aprobadorId)) {
          const err = new Error("El id del aprobador es obligatorio");
          err.statusCode = 400;
          throw err;
        }

        const aprobadorExiste = await Colaborador.findByPk(aprobadorId, {
          attributes: ["id_colaborador"],
          transaction: tx,
        });
        if (!aprobadorExiste) {
          const err = new Error("El id del aprobador es obligatorio");
          err.statusCode = 400;
          throw err;
        }

        patch.aprobado_por = aprobadorId;

        if (nuevoEstadoTxt === "APROBADO") {
          let horasAprobadasFinal = horasFinal;

          if (
            horas_aprobadas !== undefined &&
            horas_aprobadas !== null &&
            String(horas_aprobadas).trim() !== ""
          ) {
            const ha = Number(String(horas_aprobadas).trim());
            if (!Number.isFinite(ha) || ha <= 0) {
              const err = new Error("horas_aprobadas debe ser un número mayor a 0");
              err.statusCode = 400;
              throw err;
            }
            if (ha > horasFinal) {
              const err = new Error("horas_aprobadas no puede ser mayor que horas_solicitadas");
              err.statusCode = 409;
              throw err;
            }
            horasAprobadasFinal = ha;
          }

          patch.horas_aprobadas = horasAprobadasFinal;
        } else {
          patch.horas_aprobadas = 0;
        }
      }

      if (nuevoEstadoTxt === "CANCELADO") {
        patch.horas_aprobadas = 0;
      }

      patch.estado = estadoNuevo.id_estado;
    }

    const keys = Object.keys(patch);
    if (keys.length === 0) {
      const err = new Error("No se enviaron campos para actualizar");
      err.statusCode = 400;
      throw err;
    }

    await current.update(patch, { transaction: tx });

    const colab = await Colaborador.findByPk(current.id_colaborador, {
      attributes: [
        "id_colaborador",
        "correo_electronico",
        "nombre",
        "primer_apellido",
        "segundo_apellido",
      ],
      transaction: tx,
    });

    const estadoFinal = await Estado.findByPk(current.estado, {
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });

    const estadoFinalTxt = String(estadoFinal?.estado ?? "").toUpperCase();
    const estadoCambio = estadoFinalTxt !== estadoAnteriorTxt;

    correoColaborador = colab?.correo_electronico ?? null;

    notificarColaborador =
      estadoCambio && (estadoFinalTxt === "APROBADO" || estadoFinalTxt === "RECHAZADO");

    if (notificarColaborador && correoColaborador) {
      const nombreCompleto = colab
        ? `${colab.nombre ?? ""} ${colab.primer_apellido ?? ""} ${colab.segundo_apellido ?? ""}`.trim()
        : `Colaborador #${current.id_colaborador}`;

      const esAprobado = estadoFinalTxt === "APROBADO";
      const variante = esAprobado ? "success" : "danger";

      const titulo = `Solicitud de horas extra ${esAprobado ? "aprobada" : "rechazada"}`;
      const subtitulo = `Hola ${nombreCompleto}, tu solicitud de horas extra fue ${
        esAprobado ? "aprobada" : "rechazada"
      }.`;

      const detalles = [
        { etiqueta: "Fecha de trabajo", valor: String(current.fecha_trabajo) },
        { etiqueta: "Horas solicitadas", valor: String(current.horas_solicitadas) },
        ...(current.horas_aprobadas != null
          ? [{ etiqueta: "Horas aprobadas", valor: String(current.horas_aprobadas) }]
          : []),
        { etiqueta: "Tipo de hora extra", valor: String(tipoHx?.nombre ?? "") },
        { etiqueta: "Justificación", valor: String(current.justificacion ?? "") },
      ];

      htmlCorreo = plantillaNotificacionSolicitud({
        titulo,
        variante,
        subtitulo,
        mensaje: esAprobado
          ? "Puedes revisar el detalle en el sistema."
          : "Si tienes dudas, por favor comunícate con el área administrativa.",
        detalles,
      });

      subjectCorreo = titulo;
    }

    await tx.commit();

    if (notificarColaborador && correoColaborador && htmlCorreo && subjectCorreo) {
      try {
        await sendEmail({
          recipient: correoColaborador,
          subject: subjectCorreo,
          message: htmlCorreo,
        });
      } catch (mailErr) {
        console.log("No se pudo enviar correo al colaborador:", mailErr);
      }
    }

    const nombreCompleto = colab
      ? `${colab.nombre ?? ""} ${colab.primer_apellido ?? ""} ${colab.segundo_apellido ?? ""}`.trim()
      : "N/A";

    return {
      id_solicitud_hx: current.id_solicitud_hx,
      id_colaborador: current.id_colaborador,
      fecha_solicitud: current.fecha_solicitud,
      fecha_trabajo: current.fecha_trabajo,
      horas_solicitadas: String(current.horas_solicitadas),
      justificacion: current.justificacion,
      aprobado_por: current.aprobado_por ?? null,
      horas_aprobadas: current.horas_aprobadas != null ? String(current.horas_aprobadas) : null,
      tipo_hx: {
        id: tipoHx?.id_tipo_hx,
        nombre: tipoHx?.nombre,
        multiplicador: tipoHx ? String(tipoHx.multiplicador) : null,
      },
      estado: {
        id: estadoFinal?.id_estado,
        estado: estadoFinal?.estado,
      },
      colaborador: {
        id: colab?.id_colaborador,
        nombre_completo: nombreCompleto,
        correo: colab?.correo_electronico,
      },
      notificaciones: {
        colaborador_notificado: Boolean(notificarColaborador && correoColaborador),
      },
    };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
