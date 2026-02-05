import dayjs from "dayjs";
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
  Feriado,
  Incapacidad,
  JornadaDiaria,
} from "../../../../models/index.js";

import { isAfterWithTolerance, isBeforeWithTolerance } from "../helpers/checkTolerances.js";
import { buildScheduleTemplateFromHorario } from "../../../../services/scheduleEngine/templateFromSchedule.js";
import { classifyWorkedIntervalForDay } from "../../../../services/scheduleEngine/attendanceClassifier.js";
import { resolveWorkWindowForTimestamp } from "../../../../services/scheduleEngine/workWindowResolver.js";
import { validateMaxDailyMinutesForInterval } from "../../../../services/scheduleEngine/realLimits.js";
import { applyOvertimeApprovalPolicy } from "../../../../services/scheduleEngine/overtimePolicy.js";
import { loadApprovedOvertimeHoursForDate } from "../../../../services/scheduleEngine/providers/sequelizeOvertimeProvider.js";
import { isMandatoryHolidayByDate } from "../../../../services/scheduleEngine/providers/sequelizeHolidayProvider.js";
import { assertNoIncapacityCoveringDate } from "../../../../services/scheduleEngine/incapacityGuard.js";

/**
 * Registrar marca de asistencia
 *
 * @param {{
 *   identificacion: number|string,
 *   tipo_marca: string,
 *   timestamp?: Date
 * }} payload
 */
export const registrarMarcaAsistencia = async ({
  identificacion,
  tipo_marca,
  timestamp = new Date(),
}) => {
  const tx = await sequelize.transaction();

  try {
    if (
      identificacion === undefined ||
      identificacion === null ||
      String(identificacion).trim() === ""
    ) {
      throw new Error("La identificacion es obligatoria");
    }

    const tipoTxt = String(tipo_marca ?? "").trim().toUpperCase();
    if (!tipoTxt) throw new Error("El tipo de marca es obligatorio");
    if (tipoTxt !== "ENTRADA" && tipoTxt !== "SALIDA") {
      throw new Error("tipo_marca debe ser ENTRADA o SALIDA");
    }

    const identNum = Number(String(identificacion).trim());
    if (!Number.isFinite(identNum)) {
      throw new Error("La identificacion debe ser numérica");
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

    const tipoJornada = await TipoJornada.findByPk(horarioActivo.id_tipo_jornada, {
      attributes: ["id_tipo_jornada", "tipo", "max_horas_diarias"],
      transaction: tx,
    });

    if (!tipoJornada) {
      throw new Error("El horario activo no tiene un tipo de jornada válido");
    }

    const cruzaMedianoche =
      String(horarioActivo.hora_inicio ?? "") > String(horarioActivo.hora_fin ?? "");

    const template = buildScheduleTemplateFromHorario({
      hora_inicio: horarioActivo.hora_inicio,
      hora_fin: horarioActivo.hora_fin,
      dias_laborales: horarioActivo.dias_laborales,
      dias_libres: horarioActivo.dias_libres,
      minutos_descanso: horarioActivo.minutos_descanso,
      id_tipo_jornada: horarioActivo.id_tipo_jornada,
      timezone: "America/Costa_Rica",
      realEndMin: 1440,
      max_horas_diarias: 12,
    });

    const { windowStart, windowEnd, windowDateStr } = resolveWorkWindowForTimestamp({
      timestamp,
      template,
    });

    const todayDate = windowDateStr;

    await assertNoIncapacityCoveringDate({
      models: { Incapacidad, JornadaDiaria },
      idColaborador: colaborador.id_colaborador,
      dateStr: todayDate,
      transaction: tx,
    });

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
    const tipoMarcaDb = tiposMarca.find(
      (t) => String(t.nombre).toUpperCase() === tipoTxt
    );

    if (!tipoEntradaDb || !tipoSalidaDb) {
      throw new Error("No existe ENTRADA y/o SALIDA en el catálogo tipo_marca");
    }

    if (!tipoMarcaDb) {
      throw new Error(
        `No existe el tipo de marca "${tipoTxt}" en el catálogo tipo_marca`
      );
    }

    const startOfDay = windowStart.toDate();
    const endOfDay = windowEnd.toDate();

    const marcasVentana = await MarcaAsistencia.findAll({
      where: {
        id_colaborador: colaborador.id_colaborador,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay],
        },
      },
      include: [
        {
          model: TipoMarca,
          attributes: ["nombre"],
        },
      ],
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    const hasEntrada = marcasVentana.some(
      (m) => String(m.tipo_marca?.nombre ?? "").toUpperCase() === "ENTRADA"
    );
    const hasSalida = marcasVentana.some(
      (m) => String(m.tipo_marca?.nombre ?? "").toUpperCase() === "SALIDA"
    );

    if (tipoTxt === "ENTRADA" && hasEntrada) {
      throw new Error("Ya existe una marca de ENTRADA para esta jornada");
    }
    if (tipoTxt === "SALIDA" && !hasEntrada) {
      throw new Error("No se puede registrar SALIDA sin una ENTRADA previa");
    }
    if (tipoTxt === "SALIDA" && hasSalida) {
      throw new Error("Ya existe una marca de SALIDA para esta jornada");
    }

    // Límite real: no permitir más del máximo diario permitido (MVP: 12h)
    if (tipoTxt === "SALIDA") {
      const entradaExistente = marcasVentana.find(
        (m) => String(m.tipo_marca?.nombre ?? "").toUpperCase() === "ENTRADA"
      );

      if (entradaExistente) {
        validateMaxDailyMinutesForInterval({
          entradaTs: entradaExistente.timestamp,
          salidaTs: timestamp,
          dateStr: todayDate,
          template,
        });
      }
    }

    const marcaCreada = await MarcaAsistencia.create(
      {
        id_colaborador: colaborador.id_colaborador,
        id_tipo_marca: tipoMarcaDb.id_tipo_marca,
        timestamp,
        observaciones: "N/A",
      },
      { transaction: tx }
    );

    const marcasVentanaSimple = await MarcaAsistencia.findAll({
      where: {
        id_colaborador: colaborador.id_colaborador,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay],
        },
        id_tipo_marca: {
          [sequelize.Sequelize.Op.in]: [
            tipoEntradaDb.id_tipo_marca,
            tipoSalidaDb.id_tipo_marca,
          ],
        },
      },
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    const entrada = marcasVentanaSimple.find(
      (m) => m.id_tipo_marca === tipoEntradaDb.id_tipo_marca
    );
    const salida = [...marcasVentanaSimple]
      .reverse()
      .find((m) => m.id_tipo_marca === tipoSalidaDb.id_tipo_marca);

    const warnings = [];
    const toleranceMin = 5;

    if (!cruzaMedianoche && tipoTxt === "ENTRADA") {
      const late = isAfterWithTolerance(
        dayjs(timestamp),
        dayjs(`${todayDate} ${horarioActivo.hora_inicio}`),
        toleranceMin
      );
      if (late) warnings.push("ENTRADA_TARDE");
    }

    if (!cruzaMedianoche && tipoTxt === "SALIDA") {
      const early = isBeforeWithTolerance(
        dayjs(timestamp),
        dayjs(`${todayDate} ${horarioActivo.hora_fin}`),
        toleranceMin
      );
      if (early) warnings.push("SALIDA_TEMPRANO");
    }

    let horasOrdinarias = 0.0;
    let horasExtra = 0.0;
    let horasNocturnas = 0.0;
    let overtimeResult = null;

    if (entrada && salida) {
      const classified = classifyWorkedIntervalForDay({
        entradaTs: entrada.timestamp,
        salidaTs: salida.timestamp,
        dateStr: todayDate,
        template,
      });

      horasOrdinarias = classified.ordinaryHours;
      const extraCandidate = classified.extraHours;

      const approvedHoursAvailable = await loadApprovedOvertimeHoursForDate({
        models: { SolicitudHoraExtra, Estado },
        idColaborador: colaborador.id_colaborador,
        dateStr: todayDate,
        transaction: tx,
      });

      overtimeResult = applyOvertimeApprovalPolicy({
        extraCandidateHours: extraCandidate,
        approvedHoursAvailable,
      });

      horasExtra = overtimeResult.extraApprovedHours;

      warnings.push(...classified.warnings);
      warnings.push(...overtimeResult.warnings);
    }

    const feriadoObligatorio = await isMandatoryHolidayByDate({
      models: { Feriado },
      dateStr: todayDate,
      transaction: tx,
    });

    const jornadaExistente = await JornadaDiaria.findOne({
      where: {
        id_colaborador: colaborador.id_colaborador,
        fecha: todayDate,
      },
      transaction: tx,
    });

    if (!jornadaExistente) {
      await JornadaDiaria.create(
        {
          id_colaborador: colaborador.id_colaborador,
          fecha: todayDate,
          horas_trabajadas: horasOrdinarias,
          horas_extra: horasExtra,
          horas_nocturnas: horasNocturnas,
          feriado_obligatorio: feriadoObligatorio,
        },
        { transaction: tx }
      );
    } else {
      await jornadaExistente.update(
        {
          horas_trabajadas: horasOrdinarias,
          horas_extra: horasExtra,
          feriado_obligatorio: feriadoObligatorio,
        },
        { transaction: tx }
      );
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
      warnings,
      jornada: {
        fecha: todayDate,
        horas_trabajadas: horasOrdinarias,
        feriado_obligatorio: feriadoObligatorio,
        horas_extra: horasExtra,
        extra_candidata: overtimeResult?.extraCandidateHours ?? 0,
        extra_no_aprobada: overtimeResult?.extraUnapprovedHours ?? 0,
        entrada: entrada?.timestamp ?? null,
        salida: salida?.timestamp ?? null,
      },
    };
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
};
