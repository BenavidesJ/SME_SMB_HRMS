import dayjs from "dayjs";
import { Op } from "sequelize";
import {
  sequelize,
  SolicitudHoraExtra,
  TipoHoraExtra,
  Contrato,
  TipoJornada,
  Estado,
  Usuario,
  Rol,
  Colaborador,
} from "../../../../models/index.js";
import { sendEmail } from "../../../../services/mail.js";
import { plantillaSolicitudHorasExtra } from "../../../../common/htmlLayouts/plantillaSolicitudHorasExtra.js";

const MAX_JUSTIFICACION_LENGTH = 100;

export const crearSolicitudHoraExtra = async ({
  id_colaborador,
  fecha_trabajo,
  horas_solicitadas,
  id_tipo_hx,
  justificacion,
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

    const idTipoHx = Number(String(id_tipo_hx).trim());
    if (!Number.isFinite(idTipoHx)) {
      throw new Error("id_tipo_hx debe ser numérico");
    }

    const justi = String(justificacion ?? "").trim();
    if (!justi) {
      throw new Error("justificacion es obligatoria");
    }

    if (justi.length > MAX_JUSTIFICACION_LENGTH) {
      throw new Error("justificacion no puede exceder 100 caracteres");
    }

    const tipoHx = await TipoHoraExtra.findByPk(idTipoHx, {
      attributes: ["id_tipo_hx", "nombre", "multiplicador"],
      transaction: tx,
    });

    if (!tipoHx) {
      throw new Error(`No existe tipo de hora extra con id ${idTipoHx}`);
    }

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
      attributes: ["id_contrato", "id_tipo_jornada"],
      transaction: tx,
    });

    if (!contratoActivo) {
      throw new Error("El colaborador no tiene un contrato ACTIVO");
    }

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
        fecha_solicitud: new Date(),
        fecha_trabajo: fechaTxt,
        horas_solicitadas: horas,
        id_tipo_hx: idTipoHx,
        estado: ESTADO_PENDIENTE_ID,
        aprobado_por: null,
        horas_aprobadas: null,
        justificacion: justi,
      },
      { transaction: tx }
    );

    const solicitante = await Colaborador.findByPk(idColab, {
      attributes: ["id_colaborador", "identificacion", "nombre", "primer_apellido", "segundo_apellido"],
      transaction: tx,
    });

    await tx.commit();

    let emailsSent = 0;

    try {
      const adminUsers = await Usuario.findAll({
        include: [
          {
            model: Rol,
            as: "roles",
            attributes: ["nombre"],
            where: { nombre: { [Op.in]: ["ADMINISTRADOR", "SUPER_ADMIN"] } },
            required: true,
          },
          {
            model: Colaborador,
            as: "colaborador",
            attributes: ["correo_electronico", "nombre", "primer_apellido", "segundo_apellido"],
            required: true,
          },
        ],
        attributes: ["id_usuario", "id_colaborador"],
      });

      console.log(adminUsers);

      const recipients = adminUsers
        .map((u) => u?.colaborador?.correo_electronico)
        .filter(Boolean);

      for (const recipient of recipients) {
        await sendEmail({
          recipient,
          subject: "Nueva solicitud de horas extra",
          message: plantillaSolicitudHorasExtra({
            solicitanteNombre: `${solicitante.nombre} ${solicitante.primer_apellido} ${solicitante.segundo_apellido}`.trim(),
            fechaTrabajo: fechaTxt,
            horasSolicitadas: String(horas),
          }),
        });
        emailsSent++;
      }
    } catch (mailErr) {
      console.log("No se pudo enviar correo de notificación:", mailErr);
    }

    return {
      id_solicitud_hx: created.id_solicitud_hx,
      id_colaborador: created.id_colaborador,
      fecha_solicitud: created.fecha_solicitud,
      fecha_trabajo: created.fecha_trabajo,
      horas_solicitadas: String(created.horas_solicitadas),
      justificacion: created.justificacion,
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
        admins_notificados: emailsSent,
      },
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
};
