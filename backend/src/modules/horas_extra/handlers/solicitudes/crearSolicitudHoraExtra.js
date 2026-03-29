import dayjs from "dayjs";
import {
  sequelize,
  SolicitudHoraExtra,
  TipoHoraExtra,
  Contrato,
  TipoJornada,
  Estado,
  Colaborador,
  Feriado,
  HorarioLaboral,
} from "../../../../models/index.js";
import { sendEmail } from "../../../../services/mail.js";
import { plantillaSolicitudHorasExtra } from "../../../../common/plantillasEmail/emailTemplate.js";

export const crearSolicitudHoraExtra = async ({
  id_colaborador,
  fecha_trabajo,
  horas_solicitadas,
}) => {
  const tx = await sequelize.transaction();

  try {
    const idColab = Number(String(id_colaborador).trim());
    if (!Number.isFinite(idColab)) {
      throw new Error("id_colaborador debe ser numérico");
    }

    const fechaTxt = String(fecha_trabajo ?? "").trim();
    if (!fechaTxt) {
      throw new Error("fecha_trabajo es obligatoria (YYYY-MM-DD)");
    }

    if (!dayjs(fechaTxt, "YYYY-MM-DD", true).isValid()) {
      throw new Error("fecha_trabajo debe tener formato YYYY-MM-DD");
    }

    const horas = Number(String(horas_solicitadas).trim());
    if (!Number.isFinite(horas) || horas <= 0) {
      throw new Error("horas_solicitadas debe ser un número mayor a 0");
    }

    // ── Catálogo de tipos de hora extra ─────────────────────────────────
    const todosTipoHx = await TipoHoraExtra.findAll({
      attributes: ["id_tipo_hx", "nombre", "multiplicador"],
      transaction: tx,
    });

    const buscarTipoPorNombre = (nombre) =>
      todosTipoHx.find((t) => String(t.nombre).toUpperCase() === String(nombre).toUpperCase());

    const estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });

    if (!estadoActivo) {
      throw new Error('No existe el estado "ACTIVO" en el catálogo estado');
    }

    const ESTADO_ACTIVO_ID = estadoActivo.id_estado;

    const contratoActivo = await Contrato.findOne({
      where: { id_colaborador: idColab, estado: ESTADO_ACTIVO_ID },
      attributes: ["id_contrato", "id_tipo_jornada", "id_jefe_directo"],
      transaction: tx,
    });

    if (!contratoActivo) {
      throw new Error("El colaborador no tiene un contrato ACTIVO");
    }

    const idAprobador = Number(contratoActivo.id_jefe_directo);
    if (!Number.isInteger(idAprobador) || idAprobador <= 0) {
      throw new Error("El colaborador no tiene un jefe directo asignado en su contrato ACTIVO");
    }

    const aprobador = await Colaborador.findByPk(idAprobador, {
      attributes: ["id_colaborador", "correo_electronico", "nombre", "primer_apellido", "segundo_apellido"],
      transaction: tx,
    });

    if (!aprobador) {
      throw new Error(`No existe colaborador aprobador con id ${idAprobador}`);
    }

    // ── Auto-detección del tipo de hora extra ────────────────────────────
    const feriadoEnFecha = await Feriado.findOne({
      where: { fecha: fechaTxt },
      attributes: ["id_feriado", "nombre"],
      transaction: tx,
    });

    let tipoDetectadoNombre = "DIURNAS";
    if (feriadoEnFecha) {
      tipoDetectadoNombre = "FERIADO";
    } else {
      const horarioActivo = await HorarioLaboral.findOne({
        where: { id_contrato: contratoActivo.id_contrato, estado: ESTADO_ACTIVO_ID },
        attributes: ["id_horario", "hora_inicio"],
        transaction: tx,
      });

      if (horarioActivo?.hora_inicio) {
        const horaInicio = parseInt(String(horarioActivo.hora_inicio).split(":")[0], 10);
        if (!isNaN(horaInicio) && (horaInicio >= 22 || horaInicio < 6)) {
          tipoDetectadoNombre = "NOCTURNAS";
        }
      }
    }

    const tipoHx = buscarTipoPorNombre(tipoDetectadoNombre);
    if (!tipoHx) {
      throw new Error(`No existe el tipo de hora extra "${tipoDetectadoNombre}" en el catálogo tipo_hora_extra`);
    }

    const idTipoHx = tipoHx.id_tipo_hx;

    const tipoJornada = await TipoJornada.findByPk(contratoActivo.id_tipo_jornada, {
      attributes: ["id_tipo_jornada", "tipo", "max_horas_diarias", "max_horas_semanales"],
      transaction: tx,
    });

    if (!tipoJornada) {
      throw new Error("El contrato activo no tiene un tipo de jornada válido");
    }

    const maxDiarias = Number(tipoJornada.max_horas_diarias);

    if (!Number.isFinite(maxDiarias) || maxDiarias <= 0) {
      throw new Error("El tipo de jornada tiene max_horas_diarias inválido");
    }

    const totalDia = maxDiarias + horas;
    if (totalDia > 12) {
      const err = new Error(
        `La solicitud excede el máximo diario permitido. Ordinarias(${maxDiarias}) + Extra(${horas}) = ${totalDia} > 12`
      );
      err.statusCode = 409;
      throw err;
    }

    const maxExtraSegunJornada = 12 - maxDiarias;
    if (horas > maxExtraSegunJornada) {
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

    if (!estadoPendiente) {
      throw new Error('No existe el estado "PENDIENTE" en el catálogo estado');
    }

    const ESTADO_PENDIENTE_ID = estadoPendiente.id_estado;

    const duplicada = await SolicitudHoraExtra.findOne({
      where: { id_colaborador: idColab, fecha_trabajo: fechaTxt },
      attributes: ["id_solicitud_hx"],
      transaction: tx,
    });

    if (duplicada) {
      const err = new Error("Ya existe una solicitud para este dia");
      err.statusCode = 409;
      throw err;
    }

    const created = await SolicitudHoraExtra.create(
      {
        id_colaborador: idColab,
        id_aprobador: idAprobador,
        fecha_solicitud: new Date(),
        fecha_trabajo: fechaTxt,
        horas_solicitadas: horas,
        id_tipo_hx: idTipoHx,
        estado: ESTADO_PENDIENTE_ID,
      },
      { transaction: tx }
    );

    const solicitante = await Colaborador.findByPk(idColab, {
      attributes: ["id_colaborador", "identificacion", "nombre", "primer_apellido", "segundo_apellido"],
      transaction: tx,
    });

    await tx.commit();

    let aprobadorNotificado = false;

    try {
      if (aprobador.correo_electronico) {
        await sendEmail({
          recipient: aprobador.correo_electronico,
          subject: "Nueva solicitud de horas extra",
          message: plantillaSolicitudHorasExtra({
            solicitanteNombre: `${solicitante.nombre} ${solicitante.primer_apellido} ${solicitante.segundo_apellido}`.trim(),
            fechaTrabajo: fechaTxt,
            horasSolicitadas: String(horas),
          }),
        });
        aprobadorNotificado = true;
      }
    } catch (mailErr) {
      console.log("No se pudo enviar correo de notificación:", mailErr);
    }

    return {
      id_solicitud_hx: created.id_solicitud_hx,
      id_colaborador: created.id_colaborador,
      id_aprobador: created.id_aprobador,
      fecha_solicitud: created.fecha_solicitud,
      fecha_trabajo: created.fecha_trabajo,
      horas_solicitadas: String(created.horas_solicitadas),
      tipo_hx: {
        id: tipoHx.id_tipo_hx,
        nombre: tipoHx.nombre,
        multiplicador: String(tipoHx.multiplicador),
      },
      estado: {
        id: estadoPendiente.id_estado,
        estado: estadoPendiente.estado,
      },
      notificaciones: {
        aprobador_notificado: aprobadorNotificado,
      },
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
};
