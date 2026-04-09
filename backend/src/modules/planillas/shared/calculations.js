import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import { roundCurrency } from "./formatters.js";

dayjs.extend(isSameOrBefore);

const MONTHLY_RENTA_BRACKETS = [
  { limit: 918000, baseTax: 0, baseAmount: 0, rate: 0 },
  { limit: 1347000, baseTax: 0, baseAmount: 918000, rate: 0.1 },
  { limit: 2364000, baseTax: 42900, baseAmount: 1347000, rate: 0.15 },
  { limit: 4727000, baseTax: 195450, baseAmount: 2364000, rate: 0.2 },
  { limit: Infinity, baseTax: 668050, baseAmount: 4727000, rate: 0.25 },
];

const CREDITO_FISCAL_MENSUAL_POR_HIJO = 1710;
const CREDITO_FISCAL_MENSUAL_CONYUGE = 2590;

function normalizeEstadoCivil(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function resolveCantidadHijos(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.floor(numeric));
}

// ── Tarifas ──────────────────────────────────────────────────────────

/**
 * Calcula el salario diario 
 */
export function calculateDailyRate({ salarioBase }) {
  const salario = Number(salarioBase);
  if (!Number.isFinite(salario) || salario <= 0) {
    throw new Error("El contrato no tiene un salario base válido");
  }
  return salario / 30;
}

/**
 * Calcula la tarifa por hora (usado para extras, nocturnos, etc.)
 * Formula: salario_mensual / (horas_semanales × 4)
 */
export function calculateHourlyRate({ salarioBase, horasSemanales }) {
  const salario = Number(salarioBase);
  const horas = Number(horasSemanales);
  if (!Number.isFinite(salario) || salario <= 0) {
    throw new Error("El contrato no tiene un salario base válido");
  }
  if (!Number.isFinite(horas) || horas <= 0) {
    throw new Error("El contrato no tiene horas semanales válidas");
  }
  return salario / (horas * 4);
}

// ── Días laborales ───────────────────────────────────────────────────

/**
 * Calcula días laborales esperados en un período
 * @param {Object} params
 * @param {String} params.fechaInicio - YYYY-MM-DD
 * @param {String} params.fechaFin - YYYY-MM-DD
 * @param {Array<Number>} params.diasLaborales - Array de índices (0=lunes, 6=domingo)
 * @returns {Number} Cantidad de días laborales
 */
export function calcularDíasLaboralesEsperados({ fechaInicio, fechaFin, diasLaborales }) {
  if (!Array.isArray(diasLaborales) || diasLaborales.length === 0) {
    throw new Error("diasLaborales debe ser un array no vacío");
  }

  const inicio = dayjs(fechaInicio);
  const fin = dayjs(fechaFin);

  if (inicio.isAfter(fin)) {
    throw new Error("fechaInicio no puede ser posterior a fechaFin");
  }

  const diasLaboralesSet = new Set(diasLaborales);
  let count = 0;

  let actual = inicio;
  while (actual.isSameOrBefore(fin)) {
    const dayJsDay = actual.day();
    const backendDay = dayJsDay === 0 ? 6 : dayJsDay - 1;

    if (diasLaboralesSet.has(backendDay)) {
      count++;
    }

    actual = actual.add(1, "day");
  }

  return count;
}

/**
 * Normaliza la fecha fin para cálculo con mes comercial (30 días).
 * Si el período cierra en día 31, se ajusta al día 30 del mismo mes.
 * @param {string} fechaFin - YYYY-MM-DD
 * @returns {string}
 */
export function normalizarFechaFinMesComercial(fechaFin) {
  const fecha = dayjs(fechaFin);
  if (!fecha.isValid()) return fechaFin;
  if (fecha.date() !== 31) return fecha.format("YYYY-MM-DD");
  return fecha.date(30).format("YYYY-MM-DD");
}

// ── Horas ────────────────────────────────────────────────────────────

/**
 * Calcula la duración del turno ordinario a partir del horario laboral.
 * No descuenta tiempo de almuerzo.
 * @param {string} horaInicio - e.g. "08:00:00"
 * @param {string} horaFin    - e.g. "17:00:00"
 * @returns {number} horas del turno (e.g. 9)
 */
export function calcularDuracionTurno(horaInicio, horaFin) {
  const [hiH, hiM] = String(horaInicio).split(":").map(Number);
  const [hfH, hfM] = String(horaFin).split(":").map(Number);
  const minutos = (hfH * 60 + hfM) - (hiH * 60 + hiM);
  return Math.max(minutos / 60, 0);
}

/**
 * En feriado obligatorio, la jornada ordinaria se paga completa aunque no se labore.
 * @param {number} horasProgramadasDia
 * @returns {number}
 */
export function calcularHorasOrdinariasPagadasFeriadoObligatorio(horasProgramadasDia) {
  const horas = Number(horasProgramadasDia);
  if (!Number.isFinite(horas) || horas <= 0) return 0;
  return horas;
}

/**
 * En salario quincenal base fijo, trabajar feriado obligatorio genera recargo adicional +1x.
 * @param {{ horasTrabajadasFeriado: number, tarifaHora: number }} params
 * @returns {number}
 */
export function calcularRecargoFeriadoObligatorio({ horasTrabajadasFeriado, tarifaHora }) {
  const horas = Math.max(Number(horasTrabajadasFeriado ?? 0), 0);
  const tarifa = Math.max(Number(tarifaHora ?? 0), 0);
  if (!Number.isFinite(horas) || !Number.isFinite(tarifa) || horas <= 0 || tarifa <= 0) return 0;
  return roundCurrency(horas * tarifa);
}

/**
 * Suma un campo numérico de un array de jornadas.
 * @param {Array} jornadas
 * @param {string} campo - nombre del campo (horas_ordinarias, horas_extra, etc.)
 * @returns {{ cantidad: number, total: number }}
 */
export function sumarHorasJornadas(jornadas, campo) {
  let cantidad = 0;
  let total = 0;
  for (const j of jornadas) {
    const valor = Number(j[campo] ?? 0);
    if (valor > 0) {
      cantidad++;
      total += valor;
    }
  }
  return { cantidad, total: roundCurrency(total) };
}

// ── Renta con proyección a 30 días ──────────────────────────────────

/**
 * Calcula la renta proyectando el salario devengado a 30 días.
 *
 * @param {number} brutoQuincenal
 * @param {{ cantidad_hijos?: number, estado_civil?: string }} perfilFiscal
 * @returns {{
 *  monto_quincenal: number,
 *  proyectado_mensual: number,
 *  impuesto_mensual: number,
 *  impuesto_quincenal_sin_creditos: number,
 *  impuesto_mensual_con_creditos: number,
 *  creditos_fiscales: {
 *    por_conyuge_mensual: number,
 *    por_hijos_mensual: number,
 *    total_mensual: number,
 *    por_conyuge_quincenal: number,
 *    por_hijos_quincenal: number,
 *    total_quincenal: number,
 *    cantidad_hijos_aplicada: number,
 *    aplica_conyuge: boolean
 *  }
 * }}
 */
export function calcularRentaProyectada(brutoQuincenal, perfilFiscal = {}) {
  const bruto = Number(brutoQuincenal);
  const proyectadoMensual = Number.isFinite(bruto) && bruto > 0 ? bruto * 2 : 0;

  let impuestoMensual = 0;

  for (const bracket of MONTHLY_RENTA_BRACKETS) {
    if (proyectadoMensual > bracket.baseAmount) {
      const taxableInBracket = Math.min(proyectadoMensual, bracket.limit) - bracket.baseAmount;
      if (taxableInBracket > 0) {
        impuestoMensual = bracket.baseTax + taxableInBracket * bracket.rate;
      }
    }
  }

  const estadoCivil = normalizeEstadoCivil(perfilFiscal.estado_civil);
  const cantidadHijos = resolveCantidadHijos(perfilFiscal.cantidad_hijos);

  const hayImpuestoRenta = impuestoMensual > 0;
  const aplicaCreditoConyuge = hayImpuestoRenta && estadoCivil === "CASADO";
  const creditoConyugeMensual = aplicaCreditoConyuge
    ? CREDITO_FISCAL_MENSUAL_CONYUGE
    : 0;
  const creditoHijosMensual = aplicaCreditoConyuge
    ? cantidadHijos * CREDITO_FISCAL_MENSUAL_POR_HIJO
    : 0;
  const creditoTotalMensual = creditoConyugeMensual + creditoHijosMensual;
  const cantidadHijosAplicada = aplicaCreditoConyuge ? cantidadHijos : 0;

  const impuestoMensualConCreditos = Math.max(0, impuestoMensual - creditoTotalMensual);
  const impuestoQuincenalSinCreditos = roundCurrency(impuestoMensual / 2);
  const montoQuincenal = roundCurrency(impuestoMensualConCreditos / 2);

  return {
    monto_quincenal: montoQuincenal,
    proyectado_mensual: proyectadoMensual,
    impuesto_mensual: roundCurrency(impuestoMensual),
    impuesto_quincenal_sin_creditos: impuestoQuincenalSinCreditos,
    impuesto_mensual_con_creditos: roundCurrency(impuestoMensualConCreditos),
    hay_impuesto_renta: hayImpuestoRenta,
    creditos_fiscales: {
      por_conyuge_mensual: roundCurrency(creditoConyugeMensual),
      por_hijos_mensual: roundCurrency(creditoHijosMensual),
      total_mensual: roundCurrency(creditoTotalMensual),
      por_conyuge_quincenal: roundCurrency(creditoConyugeMensual / 2),
      por_hijos_quincenal: roundCurrency(creditoHijosMensual / 2),
      total_quincenal: roundCurrency(creditoTotalMensual / 2),
      cantidad_hijos_aplicada: cantidadHijosAplicada,
      aplica_conyuge: creditoConyugeMensual > 0,
    },
  };
}

// ── Deducciones obligatorias (cargas sociales) ───────────────────────

/**
 * Calcula cada deducción obligatoria como porcentaje del salario devengado.
 *
 * @param {number} salarioDevengado
 * @param {Array} deducciones
 * @returns {{ total: number, detalle: Array<{id: number, nombre: string, porcentaje: number, monto: number}> }}
 */
export function calcularDeduccionesDetallado(salarioDevengado, deducciones) {
  const base = Number(salarioDevengado);
  if (!Number.isFinite(base) || base <= 0) return { total: 0, detalle: [] };

  const detalle = [];
  let total = 0;

  for (const deduccion of deducciones) {
    const porcentaje = Number(deduccion.valor);
    if (!Number.isFinite(porcentaje) || porcentaje <= 0) continue;
    const monto = roundCurrency((base * porcentaje) / 100);
    if (monto <= 0) continue;
    total += monto;
    detalle.push({
      id: deduccion.id_deduccion,
      nombre: deduccion.nombre ?? "Deducción",
      porcentaje,
      monto,
    });
  }

  return { total: roundCurrency(total), detalle };
}
