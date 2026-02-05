import dayjs from "dayjs";
import { Op } from "sequelize";
import {
  sequelize,
  Colaborador,
  Contrato,
  HorarioLaboral,
  Estado,
  TipoMarca,
  MarcaAsistencia,
  JornadaDiaria,
  TipoJornada,
  SolicitudHoraExtra,
  SolicitudVacaciones,
  SolicitudPermisos,
} from "../../../models/index.js";
import { getDayInitial } from "./helpers/obtenerInicialDia.js";

/**
 * Registrar marca de asistencia
 *
 * @param {{
 *   identificacion: number|string,
 *   tipo_marca: string,
 *   timestamp: string (ISO 8601)
 * }} payload
 */
export const registrarMarcaAsistencia = async ({
  identificacion,
  tipo_marca,
  timestamp,
}) => {
  const tx = await sequelize.transaction();

  try {
    // Validar identificación
    if (
      identificacion === undefined ||
      identificacion === null ||
      String(identificacion).trim() === ""
    ) {
      throw new Error("La identificación es obligatoria");
    }

    const identNum = Number(String(identificacion).trim());
    if (!Number.isFinite(identNum)) {
      throw new Error("La identificación debe ser numérica");
    }

    // Validar tipo de marca
    const tipoTxt = String(tipo_marca ?? "").trim().toUpperCase();
    if (!tipoTxt) throw new Error("El tipo de marca es obligatorio");
    if (tipoTxt !== "ENTRADA" && tipoTxt !== "SALIDA") {
      throw new Error("tipo_marca debe ser ENTRADA o SALIDA");
    }

    if (!timestamp) {
      throw new Error("El timestamp es obligatorio");
    }

    const timestampDate = new Date(timestamp);
    if (isNaN(timestampDate.getTime())) {
      throw new Error("El timestamp no es una fecha válida");
    }

    const colaborador = await Colaborador.findOne({
      where: { identificacion: identNum },
      transaction: tx,
    });

    if (!colaborador) {
      throw new Error(`No existe un colaborador con identificación ${identNum}`);
    }

    const estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });

    if (!estadoActivo) {
      throw new Error(`No existe el estado "ACTIVO" en el catálogo estado`);
    }

    const ESTADO_ACTIVO_ID = estadoActivo.id_estado;

    const estadoAprobado = await Estado.findOne({
      where: { estado: "APROBADO" },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });

    const ESTADO_APROBADO_ID = estadoAprobado?.id_estado ?? null;

    const contratoActivo = await Contrato.findOne({
      where: {
        id_colaborador: colaborador.id_colaborador,
        estado: ESTADO_ACTIVO_ID,
      },
      transaction: tx,
    });

    if (!contratoActivo) {
      throw new Error("El colaborador no tiene un contrato ACTIVO");
    }

    const horarioActivo = await HorarioLaboral.findOne({
      where: {
        id_contrato: contratoActivo.id_contrato,
        estado: ESTADO_ACTIVO_ID,
      },
      transaction: tx,
    });

    if (!horarioActivo) {
      throw new Error("El contrato activo no tiene un horario ACTIVO asignado");
    }

    const fechaDia = dayjs(timestampDate).format("YYYY-MM-DD");
    const bloqueoMensaje = "Existe una incapacidad/solicitud de vacaciones aprobada /permiso aprobado para este día, contáctese con recursos humanos";

    const jornadaBloqueada = await JornadaDiaria.findOne({
      where: {
        id_colaborador: colaborador.id_colaborador,
        fecha: fechaDia,
        [Op.or]: [
          { incapacidad: { [Op.ne]: null } },
          { vacaciones: { [Op.ne]: null } },
          { permiso: { [Op.ne]: null } },
        ],
      },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (jornadaBloqueada) {
      throw new Error(bloqueoMensaje);
    }

    if (ESTADO_APROBADO_ID) {
      const vacacionAprobada = await SolicitudVacaciones.findOne({
        where: {
          id_colaborador: colaborador.id_colaborador,
          estado_solicitud: ESTADO_APROBADO_ID,
          fecha_inicio: { [Op.lte]: fechaDia },
          fecha_fin: { [Op.gte]: fechaDia },
        },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });

      if (vacacionAprobada) {
        throw new Error(bloqueoMensaje);
      }

      const permisoAprobado = await SolicitudPermisos.findOne({
        where: {
          id_colaborador: colaborador.id_colaborador,
          estado_solicitud: ESTADO_APROBADO_ID,
          fecha_inicio: { [Op.lte]: fechaDia },
          fecha_fin: { [Op.gte]: fechaDia },
        },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });

      if (permisoAprobado) {
        throw new Error(bloqueoMensaje);
      }
    }

    const tipoJornada = await TipoJornada.findByPk(contratoActivo.id_tipo_jornada, {
      attributes: ["id_tipo_jornada", "max_horas_diarias"],
      transaction: tx,
    });

    if (!tipoJornada) {
      throw new Error("No se encontró el tipo de jornada asociado al contrato activo");
    }

    const maxHorasDiarias = Number(tipoJornada.max_horas_diarias ?? 0);

    // Validar si es día laboral
    const dayInitial = getDayInitial(timestampDate);
    const diasLibres = horarioActivo.dias_libres ?? "";
    const diasLaborales = horarioActivo.dias_laborales ?? "";

    // Verificar si el día es día libre
    if (diasLibres.includes(dayInitial)) {
      throw new Error(
        `No se puede registrar marca: ${dayInitial} es día libre según el horario laboral del colaborador`
      );
    }

    // Verificar si el día está dentro de días laborales (optional stricter check)
    if (diasLaborales && !diasLaborales.includes(dayInitial)) {
      throw new Error(
        `No se puede registrar marca: ${dayInitial} no es día laboral según el horario laboral del colaborador`
      );
    }

    // Obtener tipos de marca del catálogo
    const tiposMarca = await TipoMarca.findAll({
      where: {
        nombre: {
          [sequelize.Sequelize.Op.in]: ["ENTRADA", "SALIDA"],
        },
      },
      attributes: ["id_tipo_marca", "nombre"],
      transaction: tx,
    });

    const tipoEntradaDb = tiposMarca.find(
      (t) => String(t.nombre).toUpperCase() === "ENTRADA"
    );
    const tipoSalidaDb = tiposMarca.find(
      (t) => String(t.nombre).toUpperCase() === "SALIDA"
    );

    if (!tipoEntradaDb || !tipoSalidaDb) {
      throw new Error("No existen ENTRADA y/o SALIDA en el catálogo tipo_marca");
    }

    // Obtener marcas existentes del día
    const startOfDay = dayjs(timestampDate).startOf("day").toDate();
    const endOfDay = dayjs(timestampDate).endOf("day").toDate();

    const marcasDelDia = await MarcaAsistencia.findAll({
      where: {
        id_colaborador: colaborador.id_colaborador,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay],
        },
      },
      include: [
        {
          model: TipoMarca,
          as: "tipoMarca",
          attributes: ["nombre"],
        },
      ],
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    const hasEntrada = marcasDelDia.some(
      (m) => String(m.tipoMarca?.nombre ?? "").toUpperCase() === "ENTRADA"
    );
    const hasSalida = marcasDelDia.some(
      (m) => String(m.tipoMarca?.nombre ?? "").toUpperCase() === "SALIDA"
    );

    // Validar regla de ENTRADA/SALIDA
    if (tipoTxt === "ENTRADA" && hasEntrada) {
      throw new Error("Ya existe una marca de ENTRADA para este día");
    }

    if (tipoTxt === "SALIDA" && !hasEntrada) {
      throw new Error("No se puede registrar SALIDA sin una ENTRADA previa");
    }

    if (tipoTxt === "SALIDA" && hasSalida) {
      throw new Error("Ya existe una marca de SALIDA para este día");
    }

    // Crear marca de asistencia
    const marcaCreada = await MarcaAsistencia.create(
      {
        id_colaborador: colaborador.id_colaborador,
        id_tipo_marca: tipoTxt === "ENTRADA" ? tipoEntradaDb.id_tipo_marca : tipoSalidaDb.id_tipo_marca,
        timestamp: timestampDate,
        observaciones: "N/A",
      },
      { transaction: tx }
    );

    //  Si hay ENTRADA y SALIDA, crear registro de JornadaDiaria
    let horasOrdinarias = 0.0;
    let horasExtra = 0.0;

    const marcasActualizadas = await MarcaAsistencia.findAll({
      where: {
        id_colaborador: colaborador.id_colaborador,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay],
        },
      },
      include: [
        {
          model: TipoMarca,
          as: "tipoMarca",
          attributes: ["nombre"],
        },
      ],
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    let totalWorkedMinutes = 0;
    let primeraEntradaMarca = null;
    let ultimaSalidaMarca = null;
    let entradaAbierta = null;

    for (const marca of marcasActualizadas) {
      const tipoNombre = String(marca.tipoMarca?.nombre ?? "").toUpperCase();

      if (tipoNombre === "ENTRADA") {
        if (!primeraEntradaMarca) {
          primeraEntradaMarca = marca;
        }
        entradaAbierta = dayjs(marca.timestamp);
      } else if (tipoNombre === "SALIDA") {
        if (entradaAbierta) {
          const salidaActual = dayjs(marca.timestamp);
          const diff = salidaActual.diff(entradaAbierta, "minutes");
          if (diff > 0) {
            totalWorkedMinutes += diff;
          }
          entradaAbierta = null;
        }
        ultimaSalidaMarca = marca;
      }
    }

    const entradaMarca = primeraEntradaMarca;
    const salidaMarca = ultimaSalidaMarca;

    if (entradaMarca && salidaMarca && totalWorkedMinutes > 0) {
      const totalHoras = Math.max(totalWorkedMinutes / 60, 0);

      const limiteOrdinario = maxHorasDiarias > 0 && Number.isFinite(maxHorasDiarias)
        ? Number(maxHorasDiarias)
        : totalHoras;

      horasOrdinarias = Number(Math.min(totalHoras, limiteOrdinario).toFixed(2));

      let horasExtraAprobadas = 0;

      if (ESTADO_APROBADO_ID) {
        const solicitudesAprobadas = await SolicitudHoraExtra.findAll({
          where: {
            id_colaborador: colaborador.id_colaborador,
            fecha_trabajo: fechaDia,
            estado: ESTADO_APROBADO_ID,
          },
          attributes: ["horas_solicitadas"],
          transaction: tx,
        });

        horasExtraAprobadas = solicitudesAprobadas.reduce((total, solicitud) => {
          const horas = Number(solicitud.horas_solicitadas ?? 0);
          return total + (Number.isFinite(horas) ? horas : 0);
        }, 0);

        horasExtraAprobadas = Number(horasExtraAprobadas.toFixed(2));
      }

      if (horasExtraAprobadas > 0) {
        const potencialExtra = Math.max(totalHoras - horasOrdinarias, 0);
        horasExtra = Number(Math.min(potencialExtra, horasExtraAprobadas).toFixed(2));
      } else {
        horasExtra = 0.0;
      }

      const jornadaExistente = await JornadaDiaria.findOne({
        where: {
          id_colaborador: colaborador.id_colaborador,
          fecha: fechaDia,
        },
        transaction: tx,
      });

      if (jornadaExistente) {
        await jornadaExistente.update(
          {
            horas_ordinarias: horasOrdinarias,
            horas_extra: horasExtra,
          },
          { transaction: tx }
        );
      } else {
        await JornadaDiaria.create(
          {
            id_colaborador: colaborador.id_colaborador,
            fecha: fechaDia,
            horas_ordinarias: horasOrdinarias,
            horas_extra: horasExtra,
            horas_nocturnas: 0.0,
          },
          { transaction: tx }
        );
      }
    }

    await tx.commit();

    return {
      id_marca: marcaCreada.id_marca,
      colaborador: {
        id_colaborador: colaborador.id_colaborador,
        identificacion: colaborador.identificacion,
        nombre: colaborador.nombre,
        primer_apellido: colaborador.primer_apellido,
        segundo_apellido: colaborador.segundo_apellido,
      },
      tipo_marca: tipoTxt,
      timestamp: marcaCreada.timestamp,
      fecha: fechaDia,
      jornada: {
        fecha: fechaDia,
        horas_ordinarias: horasOrdinarias,
        horas_extra: horasExtra,
        entrada: entradaMarca?.timestamp ?? null,
        salida: salidaMarca?.timestamp ?? null,
      },
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
};
