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
} from "../../../models/index.js";
import { getDayInitial } from "./asistenciaUtils/getDayInitial.js";
import { isAfterWithTolerance, isBeforeWithTolerance, round2 } from "./asistenciaUtils/checkTolerances.js";

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

    const todayDate = dayjs(timestamp).format("YYYY-MM-DD");
    const dayLetter = getDayInitial(timestamp);

    const diasLaborales = String(horarioActivo.dias_laborales ?? "")
      .trim()
      .toUpperCase();

    if (!diasLaborales.includes(dayLetter)) {
      throw new Error(
        `Hoy (${dayLetter}) no es día laboral según el horario (${diasLaborales})`
      );
    }

    const tipoMarcaDb = await TipoMarca.findOne({
      where: { nombre: tipoTxt },
      attributes: ["id_tipo_marca", "nombre"],
      transaction: tx,
    });

    if (!tipoMarcaDb) {
      throw new Error(
        `No existe el tipo de marca "${tipoTxt}" en el catálogo tipo_marca`
      );
    }

    const startOfDay = dayjs(todayDate).startOf("day").toDate();
    const endOfDay = dayjs(todayDate).endOf("day").toDate();

    const marcasHoy = await MarcaAsistencia.findAll({
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

    const hasEntrada = marcasHoy.some(
      (m) => String(m.tipo_marca?.nombre ?? "").toUpperCase() === "ENTRADA"
    );
    const hasSalida = marcasHoy.some(
      (m) => String(m.tipo_marca?.nombre ?? "").toUpperCase() === "SALIDA"
    );

    if (tipoTxt === "ENTRADA" && hasEntrada) {
      throw new Error("Ya existe una marca de ENTRADA para hoy");
    }
    if (tipoTxt === "SALIDA" && !hasEntrada) {
      throw new Error("No se puede registrar SALIDA sin una ENTRADA previa");
    }
    if (tipoTxt === "SALIDA" && hasSalida) {
      throw new Error("Ya existe una marca de SALIDA para hoy");
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

    const tipoEntradaDb = await TipoMarca.findOne({
      where: { nombre: "ENTRADA" },
      attributes: ["id_tipo_marca"],
      transaction: tx,
    });
    const tipoSalidaDb = await TipoMarca.findOne({
      where: { nombre: "SALIDA" },
      attributes: ["id_tipo_marca"],
      transaction: tx,
    });

    const marcasDiaSimple = await MarcaAsistencia.findAll({
      where: {
        id_colaborador: colaborador.id_colaborador,
        timestamp: {
          [sequelize.Sequelize.Op.between]: [startOfDay, endOfDay],
        },
        id_tipo_marca: {
          [sequelize.Sequelize.Op.in]: [
            tipoEntradaDb?.id_tipo_marca ?? -1,
            tipoSalidaDb?.id_tipo_marca ?? -1,
          ],
        },
      },
      order: [["timestamp", "ASC"]],
      transaction: tx,
    });

    const entrada = marcasDiaSimple.find(
      (m) => m.id_tipo_marca === tipoEntradaDb?.id_tipo_marca
    );
    const salida = [...marcasDiaSimple]
      .reverse()
      .find((m) => m.id_tipo_marca === tipoSalidaDb?.id_tipo_marca);

    let horasTrabajadas = 0.0;
    const warnings = [];

    const toleranceMin = 5;

    if (tipoTxt === "ENTRADA") {
      const late = isAfterWithTolerance(
        dayjs(timestamp),
        dayjs(`${todayDate} ${horarioActivo.hora_inicio}`),
        toleranceMin
      );
      if (late) warnings.push("ENTRADA_TARDE");
    }

    if (tipoTxt === "SALIDA") {
      const early = isBeforeWithTolerance(
        dayjs(timestamp),
        dayjs(`${todayDate} ${horarioActivo.hora_fin}`),
        toleranceMin
      );
      if (early) warnings.push("SALIDA_TEMPRANO");
    }

    if (entrada && salida) {
      const diffMinutes = dayjs(salida.timestamp).diff(dayjs(entrada.timestamp), "minute");
      const descanso = Number(horarioActivo.minutos_descanso ?? 0);

      let workedMinutes = diffMinutes - (Number.isFinite(descanso) ? descanso : 0);
      if (workedMinutes < 0) {
        workedMinutes = 0;
        warnings.push("MINUTOS_NEGATIVOS_POR_DESCANSO");
      }

      horasTrabajadas = round2(workedMinutes / 60);
    }

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
          horas_trabajadas: horasTrabajadas,
          horas_extra: 0,
          horas_nocturnas: 0,
          feriado_obligatorio: 0,
        },
        { transaction: tx }
      );
    } else {
      await jornadaExistente.update(
        {
          horas_trabajadas: horasTrabajadas,
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
        horas_trabajadas: horasTrabajadas,
        entrada: entrada?.timestamp ?? null,
        salida: salida?.timestamp ?? null,
      },
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};


