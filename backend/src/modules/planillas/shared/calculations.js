import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import { roundCurrency } from "./formatters.js";

dayjs.extend(isSameOrBefore);

const MONTHLY_RENTA_BRACKETS = [
  { limit: 918000, baseTax: 0, baseAmount: 0, rate: 0 },
  { limit: 1374000, baseTax: 0, baseAmount: 918000, rate: 0.1 },
  { limit: 2364000, baseTax: 45600, baseAmount: 1374000, rate: 0.15 },
  { limit: 4727000, baseTax: 194100, baseAmount: 2364000, rate: 0.2 },
  { limit: Infinity, baseTax: 666700, baseAmount: 4727000, rate: 0.25 },
];

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
 * @param {number} salarioDevengado
 * @returns {{ monto_quincenal: number, proyectado_mensual: number }}
 */
export function calcularRentaProyectada(brutoQuincenal) {

  const proyectadoMensual = brutoQuincenal * 2;

  let impuestoMensual = 0;

  for (const bracket of MONTHLY_RENTA_BRACKETS) {
    if (proyectadoMensual > bracket.baseAmount) {
      const taxableInBracket = Math.min(proyectadoMensual, bracket.limit) - bracket.baseAmount;
      if (taxableInBracket > 0) {
        impuestoMensual = bracket.baseTax + taxableInBracket * bracket.rate;
      }
    }
  }

  const montoQuincenal = roundCurrency(impuestoMensual / 2);

  return {
    monto_quincenal: montoQuincenal,
    proyectado_mensual: proyectadoMensual,
    impuesto_mensual: roundCurrency(impuestoMensual),
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
