import { roundCurrency } from "./formatters.js";

const MONTHLY_RENTA_BRACKETS = [
  { limit: 918000, baseTax: 0, baseAmount: 0, rate: 0 },
  { limit: 1374000, baseTax: 0, baseAmount: 918000, rate: 0.1 },
  { limit: 2364000, baseTax: 45600, baseAmount: 1374000, rate: 0.15 },
  { limit: 4727000, baseTax: 194100, baseAmount: 2364000, rate: 0.2 },
  { limit: Infinity, baseTax: 666700, baseAmount: 4727000, rate: 0.25 },
];

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

export function calculateRentaQuincenal(brutoQuincenal) {
  const salarioQuincenal = Number(brutoQuincenal);
  if (!Number.isFinite(salarioQuincenal) || salarioQuincenal <= 0) return 0;

  const salarioMensual = salarioQuincenal * 2;
  let impuestoMensual = 0;

  for (const bracket of MONTHLY_RENTA_BRACKETS) {
    if (salarioMensual <= bracket.limit) {
      const excedente = Math.max(0, salarioMensual - bracket.baseAmount);
      impuestoMensual = bracket.baseTax + excedente * bracket.rate;
      break;
    }
  }

  return roundCurrency(impuestoMensual / 2);
}

export function calculateDeduccionesObligatorias(bruto, deducciones) {
  const base = Number(bruto);
  if (!Number.isFinite(base) || base <= 0) return { total: 0, detalle: [] };

  const detalle = [];
  let total = 0;
  for (const deduccion of deducciones) {
    const porcentaje = Number(deduccion.valor);
    if (!Number.isFinite(porcentaje) || porcentaje <= 0) continue;
    const monto = roundCurrency((base * porcentaje) / 100);
    if (monto <= 0) continue;
    total += monto;
    detalle.push({ id: deduccion.id_deduccion, monto });
  }
  return { total: roundCurrency(total), detalle };
}
