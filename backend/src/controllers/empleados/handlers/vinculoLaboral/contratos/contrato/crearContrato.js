import {
  sequelize,
  Contrato,
  Colaborador,
  Puesto,
  TipoContrato,
  TipoJornada,
  CicloPago,
  Estado,
  HorarioLaboral,
} from "../../../../../../models/index.js";
import { normalizeDecimal } from "../../../../../../common/normalizeDecimal.js";
import { normalizeDateOnly } from "../../../../../../common/normalizeDateOnly.js";
import { normalizeTime } from "../../jornadas/helpers/normalizeTime.js";
import { normalizeDays } from "../../jornadas/helpers/normalizeDays.js";
import { setsAreDisjoint } from "../../jornadas/helpers/checkSetsDisjoint.js";
import dayjs from "dayjs";

/**
 * Crear Contrato
 */
export const crearNuevoContrato = async ({
  id_colaborador,
  puesto,
  fecha_inicio,
  tipo_contrato,
  tipo_jornada,
  salario_base,
  ciclo_pago,
  horas_semanales,
  horario
}) => {
  const tx = await sequelize.transaction();

  try {
    const required = {
      id_colaborador,
      puesto,
      fecha_inicio,
      tipo_contrato,
      tipo_jornada,
      salario_base,
      ciclo_pago,
      horario,
    };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || String(value).trim() === "") {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }
    if (!horario || typeof horario !== "object" || Array.isArray(horario)) {
      throw new Error("La información del horario es obligatoria");
    }

    const estadoActivo = await Estado.findOne({
      where: { estado: "ACTIVO" },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });

    const ESTADO_ACTIVO_ID = estadoActivo.id_estado;

    const colaborador = await Colaborador.findByPk(id_colaborador, { transaction: tx });
    if (!colaborador) throw new Error(`No existe un colaborador con id ${id_colaborador}`);

    const nombrePuesto = String(puesto ?? "").trim().toUpperCase();
    const position = await Puesto.findOne({
      where: { nombre: nombrePuesto },
      transaction: tx,
    });
    if (!position) throw new Error(`No existe un puesto ${puesto}`);

    const nombreTipoContrato = String(tipo_contrato ?? "").trim().toUpperCase();
    const contractType = await TipoContrato.findOne({
      where: { tipo_contrato: nombreTipoContrato },
      transaction: tx,
    });
    if (!contractType) throw new Error(`No existe un tipo de contrato ${tipo_contrato}`);

    const nombreTipoJornada = String(tipo_jornada ?? "").trim().toUpperCase();
    const scheduleType = await TipoJornada.findOne({
      where: { tipo: nombreTipoJornada },
      transaction: tx,
    });
    if (!scheduleType) throw new Error(`No existe un tipo de jornada ${tipo_jornada}`);

    const nombreCicloPago = String(ciclo_pago ?? "").trim().toUpperCase();
    const paymentCycle = await CicloPago.findOne({
      where: { nombre: nombreCicloPago },
      transaction: tx
    });
    if (!paymentCycle) throw new Error(`No existe un ciclo de pago ${ciclo_pago}`);

    // -----------------------------
    // Validar que no exista contrato ACTIVO para el colaborador
    // -----------------------------
    const contratoActivo = await Contrato.findOne({
      where: { id_colaborador, estado: ESTADO_ACTIVO_ID },
      transaction: tx,
    });

    if (contratoActivo) {
      throw new Error(
        "El colaborador ya tiene un contrato activo. Primero desactive el contrato actual para asignar uno nuevo."
      );
    }

    const salarioBaseNormalized = normalizeDecimal(salario_base, {
      precision: 12,
      scale: 2,
      fieldName: "salario_base",
    });

    const horasDefault = scheduleType.max_horas_semanales;
    const horasValue =
      horas_semanales === undefined ||
        horas_semanales === null ||
        String(horas_semanales).trim() === ""
        ? horasDefault
        : horas_semanales;

    const horasSemanalNormalized = normalizeDecimal(horasValue, {
      precision: 5,
      scale: 2,
      fieldName: "horas_semanales",
    });

    const fecha = normalizeDateOnly(fecha_inicio, "fecha_inicio");

    const maxSem = Number(String(scheduleType.max_horas_semanales).replace(",", "."));
    const horasSem = Number(String(horasSemanalNormalized).replace(",", "."));

    if (!Number.isFinite(maxSem) || !Number.isFinite(horasSem)) {
      throw new Error("Error interno: horas semanales inválidas");
    }
    if (horasSem <= 0) throw new Error("horas_semanales debe ser mayor a 0");
    if (horasSem > maxSem) {
      throw new Error(
        `horas_semanales (${horasSem}) no puede exceder el máximo semanal del tipo de jornada (${maxSem})`
      );
    }

    const warnings = [];

    const refMin = Number(String(position.sal_base_referencia_min).replace(",", "."));
    const refMax = Number(String(position.sal_base_referencia_max).replace(",", "."));
    const salarioNum = Number(String(salarioBaseNormalized).replace(",", "."));

    if (Number.isFinite(refMin) && Number.isFinite(refMax) && Number.isFinite(salarioNum)) {
      if (salarioNum < refMin) {
        warnings.push(
          `El salario_base (${salarioNum}) es menor al salario de referencia mínimo del puesto (${refMin}). Verifique si corresponde.`
        );
      }
      if (salarioNum > refMax) {
        warnings.push(
          `El salario_base (${salarioNum}) excede el salario de referencia máximo del puesto (${refMax}). Considere actualizar el salario de referencia máximo para este puesto.`
        );
      }
    }

    const nuevoContrato = await Contrato.create(
      {
        id_colaborador,
        id_puesto: position.id_puesto,
        fecha_inicio: fecha,
        id_tipo_contrato: contractType.id_tipo_contrato,
        id_tipo_jornada: scheduleType.id_tipo_jornada,
        horas_semanales: horasSemanalNormalized,
        salario_base: salarioBaseNormalized,
        id_ciclo_pago: paymentCycle.id_ciclo_pago,
        estado: ESTADO_ACTIVO_ID,
      },
      { transaction: tx }
    );

    const {
      hora_inicio,
      hora_fin,
      minutos_descanso,
      dias_laborales,
      dias_libres,
    } = horario ?? {};

    const inicio = normalizeTime(hora_inicio, "horario.hora_inicio");
    const fin = normalizeTime(hora_fin, "horario.hora_fin");

    if (inicio === fin) {
      throw new Error("La hora de inicio y la hora de salida no pueden ser iguales.");
    }

    const descanso =
      minutos_descanso === undefined || minutos_descanso === null || String(minutos_descanso).trim() === ""
        ? 0
        : Number(minutos_descanso);

    if (!Number.isInteger(descanso) || descanso < 0) {
      throw new Error("Los minutos de descanso debe ser un entero mayor o igual a 0");
    } const laborales = normalizeDays(dias_laborales, "horario.dias_laborales", { defaultValue: "LKMJV" });
    const libres = normalizeDays(dias_libres, "horario.dias_libres", { defaultValue: "SD" });

    if (!setsAreDisjoint(laborales, libres)) {
      throw new Error("horario.dias_laborales y horario.dias_libres no pueden contener los mismos días");
    }

    const fechaActualizacion = dayjs().format("YYYY-MM-DD");

    const horarioCreado = await HorarioLaboral.create(
      {
        id_contrato: nuevoContrato.id_contrato,
        hora_inicio: inicio,
        hora_fin: fin,
        minutos_descanso: descanso,
        dias_laborales: laborales,
        dias_libres: libres,
        estado: ESTADO_ACTIVO_ID,
        fecha_actualizacion: fechaActualizacion,
        id_tipo_jornada: scheduleType.id_tipo_jornada,
      },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id: nuevoContrato.id_contrato,
      id_colaborador: nuevoContrato.id_colaborador,
      id_puesto: nuevoContrato.id_puesto,
      fecha_inicio: nuevoContrato.fecha_inicio,
      id_tipo_contrato: nuevoContrato.id_tipo_contrato,
      id_tipo_jornada: nuevoContrato.id_tipo_jornada,
      horas_semanales: nuevoContrato.horas_semanales,
      salario_base: nuevoContrato.salario_base,
      id_ciclo_pago: nuevoContrato.id_ciclo_pago,
      estado: nuevoContrato.estado,
      horario: {
        id: horarioCreado.id_horario,
        id_contrato: horarioCreado.id_contrato,
        hora_inicio: horarioCreado.hora_inicio,
        hora_fin: horarioCreado.hora_fin,
        minutos_descanso: horarioCreado.minutos_descanso,
        dias_laborales: horarioCreado.dias_laborales,
        dias_libres: horarioCreado.dias_libres,
        fecha_actualizacion: horarioCreado.fecha_actualizacion,
        id_tipo_jornada: horarioCreado.id_tipo_jornada,
        estado: horarioCreado.estado,
      },
      warnings,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
