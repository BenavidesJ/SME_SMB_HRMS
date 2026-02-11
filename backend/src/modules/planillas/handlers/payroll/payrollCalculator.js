import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import {
  calculateHourlyRate,
  calculateDailyRate,
  calcularDíasLaboralesEsperados,
  calcularDuracionTurno,
  calcularRentaProyectada,
  calcularDeduccionesDetallado,
} from "../../shared/calculations.js";
import { ensureEstado } from "../../shared/resolvers.js";
import { roundCurrency, roundDecimal } from "../../shared/formatters.js";

dayjs.extend(isSameOrBefore);

const {
  PeriodoPlanilla,
  Contrato,
  JornadaDiaria,
  Deduccion,
  Feriado,
} = models;

/* ─────────────────────────────────────────────────────────────────────
   Funciones de obtención de datos
   ───────────────────────────────────────────────────────────────────── */

async function obtenerJornadas({ colaboradorId, fechaInicio, fechaFin, transaction }) {
  const registros = await JornadaDiaria.findAll({
    attributes: [
      "id_jornada",
      "fecha",
      "horas_ordinarias",
      "horas_extra",
      "horas_nocturnas",
      "feriado",
      "incapacidad",
      "vacaciones",
      "permiso",
    ],
    where: {
      id_colaborador: colaboradorId,
      fecha: { [Op.between]: [fechaInicio, fechaFin] },
    },
    include: [
      {
        association: "incapacidadRef",
        attributes: ["porcentaje_patrono", "porcentaje_ccss"],
        required: false,
      },
    ],
    order: [["fecha", "ASC"]],
    raw: false,
    transaction,
  });

  return registros.map((j) => ({
    fecha: dayjs(j.fecha).format("YYYY-MM-DD"),
    horas_ordinarias: Number(j.horas_ordinarias ?? 0),
    horas_extra: Number(j.horas_extra ?? 0),
    horas_nocturnas: Number(j.horas_nocturnas ?? 0),
    es_feriado: j.feriado !== null,
    id_incapacidad: j.incapacidad,
    incapacidad_data: j.incapacidadRef
      ? {
          porcentaje_patrono: Number(j.incapacidadRef.porcentaje_patrono ?? 0),
          porcentaje_ccss: Number(j.incapacidadRef.porcentaje_ccss ?? 0),
        }
      : null,
    id_vacaciones: j.vacaciones,
    id_permiso: j.permiso,
  }));
}

async function obtenerFeriados({ fechaInicio, fechaFin, transaction }) {
  const feriados = await Feriado.findAll({
    where: {
      fecha: { [Op.between]: [fechaInicio, fechaFin] },
      es_obligatorio: true,
    },
    attributes: ["id_feriado", "fecha", "nombre"],
    transaction,
  });

  return feriados.map((f) => ({
    id_feriado: f.id_feriado,
    fecha: dayjs(f.fecha).format("YYYY-MM-DD"),
    nombre: f.nombre,
  }));
}

async function obtenerVacacionesAprobadas({ colaboradorId, fechaInicio, fechaFin, transaction }) {
  return models.SolicitudVacaciones.findAll({
    attributes: ["id_solicitud_vacaciones", "fecha_inicio", "fecha_fin"],
    where: {
      id_colaborador: colaboradorId,
      fecha_inicio: { [Op.lte]: fechaFin },
      fecha_fin: { [Op.gte]: fechaInicio },
      "$estadoSolicitud.estado$": "APROBADO",
    },
    include: [
      { association: "estadoSolicitud", attributes: ["estado"], required: true },
    ],
    transaction,
  });
}

async function obtenerPermisosConGoce({ colaboradorId, fechaInicio, fechaFin, transaction }) {
  return models.SolicitudPermisos.findAll({
    attributes: ["id_solicitud", "fecha_inicio", "fecha_fin", "cantidad_dias"],
    where: {
      id_colaborador: colaboradorId,
      con_goce_salarial: true,
      fecha_inicio: { [Op.lte]: fechaFin },
      fecha_fin: { [Op.gte]: fechaInicio },
      "$estadoSolicitud.estado$": "APROBADO",
    },
    include: [
      { association: "estadoSolicitud", attributes: ["estado"], required: true },
    ],
    transaction,
  });
}

/* ─────────────────────────────────────────────────────────────────────
   Utilidades
   ───────────────────────────────────────────────────────────────────── */

function expandirRangoFechas(registros, campoInicio = "fecha_inicio", campoFin = "fecha_fin") {
  const fechas = new Set();
  for (const r of registros) {
    let actual = dayjs(r[campoInicio]);
    const fin = dayjs(r[campoFin]);
    while (actual.isSameOrBefore(fin)) {
      fechas.add(actual.format("YYYY-MM-DD"));
      actual = actual.add(1, "day");
    }
  }
  return fechas;
}

function parseDiasLaborales(diasLibresStr) {
  const allDays = [0, 1, 2, 3, 4, 5, 6];
  if (!diasLibresStr) return [0, 1, 2, 3, 4];

  const str = diasLibresStr.toUpperCase();
  const libresSet = new Set();
  if (str.includes("L")) libresSet.add(0);
  if (str.includes("M")) libresSet.add(1);
  if (str.includes("K")) libresSet.add(2);
  if (str.includes("J")) libresSet.add(3);
  if (str.includes("V")) libresSet.add(4);
  if (str.includes("S")) libresSet.add(5);
  if (str.includes("D")) libresSet.add(6);
  return allDays.filter((d) => !libresSet.has(d));
}

/* ─────────────────────────────────────────────────────────────────────
   Procesamiento de días del período
   ───────────────────────────────────────────────────────────────────── */

function procesarDiasPeriodo({
  fechaInicio,
  fechaFin,
  jornadas,
  feriadosFechas,
  vacacionesFechas,
  permisosConGoceFechas,
  diasLaboralesSet,
  salarioDiario,
}) {
  const jornadaMap = new Map(jornadas.map((j) => [j.fecha, j]));

  let totalHorasExtra = 0;
  let totalHorasNocturnas = 0;
  let totalHorasFeriado = 0;

  let diasAusencias = 0;
  let montoDescuentoAusencias = 0;
  let diasIncapacidad = 0;
  let montoDescuentoIncapacidad = 0;

  let diasTrabajados = 0;
  let diasFeriado = 0;
  let diasVacaciones = 0;
  let diasPermisosConGoce = 0;
  let diasNoLaborales = 0;

  let actual = dayjs(fechaInicio);
  const fin = dayjs(fechaFin);

  while (actual.isSameOrBefore(fin)) {
    const fechaStr = actual.format("YYYY-MM-DD");
    const jornada = jornadaMap.get(fechaStr);
    const dayOfWeek = (actual.day() + 6) % 7;
    const esLaboral = diasLaboralesSet.has(dayOfWeek);

    if (!esLaboral) {
      if (jornada) {
        totalHorasExtra += jornada.horas_extra;
        totalHorasNocturnas += jornada.horas_nocturnas;
      }
      diasNoLaborales++;
    } else if (jornada && jornada.horas_ordinarias > 0) {
      diasTrabajados++;
      totalHorasExtra += jornada.horas_extra;
      totalHorasNocturnas += jornada.horas_nocturnas;

      if (jornada.es_feriado) {
        totalHorasFeriado += jornada.horas_ordinarias;
      }
    } else if (feriadosFechas.has(fechaStr)) {
      diasFeriado++;
    } else if (vacacionesFechas.has(fechaStr)) {
      diasVacaciones++;
    } else if (permisosConGoceFechas.has(fechaStr)) {
      diasPermisosConGoce++;
    } else if (jornada && jornada.id_incapacidad && jornada.incapacidad_data) {
      const { porcentaje_patrono } = jornada.incapacidad_data;
      diasIncapacidad++;
      if (porcentaje_patrono <= 0) {
        montoDescuentoIncapacidad += salarioDiario;
      } else if (porcentaje_patrono < 100) {
        const porcionNoCubierta = (100 - porcentaje_patrono) / 100;
        montoDescuentoIncapacidad += roundCurrency(salarioDiario * porcionNoCubierta);
      }
    } else {
      diasAusencias++;
      montoDescuentoAusencias += salarioDiario;
    }

    actual = actual.add(1, "day");
  }

  return {
    totalHorasExtra: roundCurrency(totalHorasExtra),
    totalHorasNocturnas: roundCurrency(totalHorasNocturnas),
    totalHorasFeriado: roundCurrency(totalHorasFeriado),
    diasAusencias,
    montoDescuentoAusencias: roundCurrency(montoDescuentoAusencias),
    diasIncapacidad,
    montoDescuentoIncapacidad: roundCurrency(montoDescuentoIncapacidad),
    totalDescuentosDias: roundCurrency(montoDescuentoAusencias + montoDescuentoIncapacidad),
    diasTrabajados,
    diasFeriado,
    diasVacaciones,
    diasPermisosConGoce,
    diasNoLaborales,
  };
}

/* ─────────────────────────────────────────────────────────────────────
   Desglose línea a línea para el frontend
   ───────────────────────────────────────────────────────────────────── */

function construirDetallesSalario({
  salarioMensual,
  salarioDiario,
  salarioQuincenal,
  tarifaHora,
  duracionTurno,
  diasLaboralesEsperados,
  resumenDias,
  pagoExtra,
  pagoNocturno,
  pagoFeriado,
  bruto,
  renta,
  deduccionesDetalle,
  neto,
}) {
  const lineas = [];

  lineas.push({ item: "Salario mensual", cantidad: 1, unitario: salarioMensual, total: salarioMensual });
  lineas.push({ item: "Salario quincenal (base)", cantidad: 1, unitario: salarioQuincenal, total: salarioQuincenal });
  lineas.push({ item: "Salario diario (mensual / 30)", cantidad: 1, unitario: roundCurrency(salarioDiario), total: roundCurrency(salarioDiario) });
  lineas.push({ item: "Tarifa por hora (extras/nocturnos/feriados)", cantidad: 1, unitario: roundCurrency(tarifaHora), total: 0 });
  lineas.push({ item: "Duración turno (hrs)", cantidad: duracionTurno, unitario: 0, total: 0 });
  lineas.push({ item: "Días laborales esperados en período", cantidad: diasLaboralesEsperados, unitario: 0, total: 0 });

  lineas.push({ item: "Días trabajados", cantidad: resumenDias.diasTrabajados, unitario: 0, total: 0 });
  if (resumenDias.diasFeriado > 0) {
    lineas.push({ item: "Feriados no trabajados (pagados)", cantidad: resumenDias.diasFeriado, unitario: 0, total: 0 });
  }
  if (resumenDias.diasVacaciones > 0) {
    lineas.push({ item: "Días de vacaciones (pagados)", cantidad: resumenDias.diasVacaciones, unitario: 0, total: 0 });
  }
  if (resumenDias.diasPermisosConGoce > 0) {
    lineas.push({ item: "Días permiso con goce (pagados)", cantidad: resumenDias.diasPermisosConGoce, unitario: 0, total: 0 });
  }

  if (resumenDias.diasAusencias > 0) {
    lineas.push({ item: "Ausencias injustificadas (-)", cantidad: resumenDias.diasAusencias, unitario: roundCurrency(salarioDiario), total: -resumenDias.montoDescuentoAusencias });
  }
  if (resumenDias.diasIncapacidad > 0) {
    lineas.push({ item: "Incapacidad – porción no cubierta por patrono (-)", cantidad: resumenDias.diasIncapacidad, unitario: 0, total: -resumenDias.montoDescuentoIncapacidad });
  }
  if (resumenDias.totalHorasExtra > 0) {
    lineas.push({ item: "Horas extra (×1.5)", cantidad: resumenDias.totalHorasExtra, unitario: roundCurrency(tarifaHora * 1.5), total: pagoExtra });
  }
  if (resumenDias.totalHorasNocturnas > 0) {
    lineas.push({ item: "Horas nocturnas (×0.25 recargo)", cantidad: resumenDias.totalHorasNocturnas, unitario: roundCurrency(tarifaHora * 0.25), total: pagoNocturno });
  }
  if (resumenDias.totalHorasFeriado > 0) {
    lineas.push({ item: "Horas feriado trabajado (doble paga)", cantidad: resumenDias.totalHorasFeriado, unitario: roundCurrency(tarifaHora), total: pagoFeriado });
  }

  lineas.push({ item: "SALARIO DEVENGADO (BRUTO)", cantidad: 1, unitario: 0, total: bruto });

  for (const ded of deduccionesDetalle) {
    lineas.push({ item: `${ded.nombre} (${ded.porcentaje}%) (-)`, cantidad: 1, unitario: 0, total: -ded.monto });
  }

  if (renta.monto_quincenal > 0) {
    lineas.push({
      item: `Impuesto sobre la renta (-) [proyectado mensual: ₡${renta.proyectado_mensual.toLocaleString("es-CR")}]`,
      cantidad: 1,
      unitario: 0,
      total: -renta.monto_quincenal,
    });
  }

  lineas.push({ item: "SALARIO NETO A PAGAR", cantidad: 1, unitario: 0, total: neto });

  return lineas;
}

/* ─────────────────────────────────────────────────────────────────────
   Cálculo puro para un colaborador (sin persistencia)
   ───────────────────────────────────────────────────────────────────── */

/**
 * Calcula la planilla quincenal de un colaborador dado un período.
 * Retorna todos los datos calculados sin escribir en BD.
 *
 * @param {{
 *   colaboradorId: number,
 *   periodoId: number,
 *   fechaInicio: string,
 *   fechaFin: string,
 *   feriadosFechas: Set<string>,
 *   deduccionesObligatorias: Array,
 *   estadoActivo: { id_estado: number },
 *   transaction?: import("sequelize").Transaction
 * }} params
 * @returns {Promise<object>} Resultado calculado con desglose completo
 */
export async function calcularPlanillaColaborador({
  colaboradorId,
  periodoId,
  fechaInicio,
  fechaFin,
  feriadosFechas,
  deduccionesObligatorias,
  estadoActivo,
  transaction,
}) {
  // 1. Contrato activo
  const contrato = await Contrato.findOne({
    where: { id_colaborador: colaboradorId, estado: estadoActivo.id_estado },
    order: [["fecha_inicio", "DESC"]],
    transaction,
  });

  if (!contrato) throw new Error("El colaborador no tiene un contrato activo");

  const salarioMensual = Number(contrato.salario_base);
  if (!Number.isFinite(salarioMensual) || salarioMensual <= 0) {
    throw new Error("El contrato no tiene un salario base mensual válido");
  }

  const horasSemanales = Number(contrato.horas_semanales);
  if (!Number.isFinite(horasSemanales) || horasSemanales <= 0) {
    throw new Error("El contrato no tiene horas semanales válidas");
  }

  // 2. Horario laboral activo
  const horario = await models.HorarioLaboral.findOne({
    where: { id_contrato: contrato.id_contrato, estado: estadoActivo.id_estado },
    attributes: ["hora_inicio", "hora_fin", "dias_laborales", "dias_libres"],
    transaction,
  });

  if (!horario) throw new Error("El contrato no tiene un horario laboral activo");

  // 3. Tarifas
  const salarioQuincenal = roundCurrency(salarioMensual / 2);
  const salarioDiario = calculateDailyRate({ salarioBase: salarioMensual });
  const tarifaHora = calculateHourlyRate({ salarioBase: salarioMensual, horasSemanales });
  const duracionTurno = calcularDuracionTurno(horario.hora_inicio, horario.hora_fin);

  // 4. Días laborales esperados
  const diasLaborales = parseDiasLaborales(horario.dias_libres);
  const diasLaboralesSet = new Set(diasLaborales);
  const diasLaboralesEsperados = calcularDíasLaboralesEsperados({
    fechaInicio,
    fechaFin,
    diasLaborales,
  });

  // 5. Jornadas registradas
  const jornadas = await obtenerJornadas({
    colaboradorId,
    fechaInicio,
    fechaFin,
    transaction,
  });

  // 6. Vacaciones y permisos con goce
  const vacaciones = await obtenerVacacionesAprobadas({
    colaboradorId, fechaInicio, fechaFin, transaction,
  });
  const permisos = await obtenerPermisosConGoce({
    colaboradorId, fechaInicio, fechaFin, transaction,
  });

  const vacacionesFechas = expandirRangoFechas(vacaciones);
  const permisosConGoceFechas = expandirRangoFechas(permisos);

  // 7. Procesar todos los días del período
  const resumenDias = procesarDiasPeriodo({
    fechaInicio,
    fechaFin,
    jornadas,
    feriadosFechas,
    vacacionesFechas,
    permisosConGoceFechas,
    diasLaboralesSet,
    salarioDiario,
  });

  // 8. Calcular montos
  const pagoExtra = roundCurrency(resumenDias.totalHorasExtra * tarifaHora * 1.5);
  const pagoNocturno = roundCurrency(resumenDias.totalHorasNocturnas * tarifaHora * 0.25);
  const pagoFeriado = roundCurrency(resumenDias.totalHorasFeriado * tarifaHora);

  const bruto = roundCurrency(
    salarioQuincenal
    - resumenDias.totalDescuentosDias
    + pagoExtra
    + pagoNocturno
    + pagoFeriado
  );

  // 9. Deducciones obligatorias (cargas sociales)
  const { total: totalDeducciones, detalle: deduccionesDetalle } =
    calcularDeduccionesDetallado(bruto, deduccionesObligatorias);

  // 10. Renta
  const renta = calcularRentaProyectada(bruto);

  // 11. Salario neto
  const totalDescuentos = roundCurrency(totalDeducciones + renta.monto_quincenal);
  const neto = Math.max(0, roundCurrency(bruto - totalDescuentos));

  // 12. Desglose para el frontend
  const detalles_calculo = construirDetallesSalario({
    salarioMensual,
    salarioDiario,
    salarioQuincenal,
    tarifaHora,
    duracionTurno,
    diasLaboralesEsperados,
    resumenDias,
    pagoExtra,
    pagoNocturno,
    pagoFeriado,
    bruto,
    renta,
    deduccionesDetalle,
    neto,
  });

  return {
    id_colaborador: colaboradorId,
    id_contrato: contrato.id_contrato,
    salarioMensual,
    salarioQuincenal,
    salarioDiario,
    tarifaHora,
    duracionTurno,
    diasLaboralesEsperados,
    resumenDias,
    pagoExtra,
    pagoNocturno,
    pagoFeriado,
    bruto,
    totalDeducciones,
    deduccionesDetalle,
    totalDescuentos,
    renta,
    neto,
    detalles_calculo,
    // Datos para persistencia
    dataPlanilla: {
      id_contrato: contrato.id_contrato,
      horas_ordinarias: roundDecimal(resumenDias.diasTrabajados * duracionTurno),
      horas_extra: roundDecimal(resumenDias.totalHorasExtra),
      horas_nocturnas: roundDecimal(resumenDias.totalHorasNocturnas),
      horas_feriado: roundDecimal(resumenDias.totalHorasFeriado),
      bruto,
      deducciones: totalDescuentos,
      neto,
    },
  };
}

/**
 * Carga datos globales del período (período, feriados, deducciones, estado activo).
 * Reutilizable tanto por simulación como por creación.
 *
 * @param {{ periodoId: number, transaction?: import("sequelize").Transaction }} params
 * @returns {Promise<{ periodo, fechaInicio, fechaFin, feriadosFechas, deduccionesObligatorias, estadoActivo }>}
 */
export async function cargarDatosGlobalesPeriodo({ periodoId, transaction }) {
  const periodo = await PeriodoPlanilla.findByPk(periodoId, { transaction });
  if (!periodo) throw new Error(`No existe un periodo de planilla con id ${periodoId}`);

  const fechaInicio = dayjs(periodo.fecha_inicio).format("YYYY-MM-DD");
  const fechaFin = dayjs(periodo.fecha_fin).format("YYYY-MM-DD");

  const estadoActivo = await ensureEstado("ACTIVO", transaction);

  const deduccionesObligatorias = await Deduccion.findAll({
    where: { es_voluntaria: false },
    transaction,
  });

  const feriados = await obtenerFeriados({ fechaInicio, fechaFin, transaction });
  const feriadosFechas = new Set(feriados.map((f) => f.fecha));

  return {
    periodo,
    fechaInicio,
    fechaFin,
    feriadosFechas,
    deduccionesObligatorias,
    estadoActivo,
  };
}
