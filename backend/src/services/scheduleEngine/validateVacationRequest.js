import { loadActiveContractAndTemplate } from "./sequelizeScheduleProvider.js";
import { loadHolidaysMap } from "./sequelizeScheduleProvider.js";
import { loadExistingBlocksForRange } from "./sequelizeBlocksProvider.js";

import { findDateRangeConflicts } from "./conflicts.js";
import { computeChargeableVacationDays } from "./vacationsChargeableDays.js";

/**
 * @param {Object} params
 * @param {number} params.idColaborador
 * @param {string} params.startDate - YYYY-MM-DD
 * @param {string} params.endDate - YYYY-MM-DD
 * @param {Object} params.models
 * @param {Object} params.config
 * @param {Object} params.saldoVacaciones 
 */
export async function validateVacationRequest({
  idColaborador,
  startDate,
  endDate,
  models,
  config,
  saldoVacaciones,
}) {
  if (!idColaborador) throw new Error("validateVacationRequest: idColaborador is required");
  if (!startDate || !endDate) throw new Error("validateVacationRequest: start/end required");
  if (!models) throw new Error("validateVacationRequest: models required");
  if (!saldoVacaciones) throw new Error("validateVacationRequest: saldoVacaciones required");

  // Template desde contrato + horario
  const { template } = await loadActiveContractAndTemplate({
    idColaborador,
    models,
    config,
  });

  // Feriados del rango
  const holidaysMap = await loadHolidaysMap({
    startDate,
    endDate,
    models,
  });

  // 3) Bloques existentes (vacaciones + incapacidades)
  const existingBlocks = await loadExistingBlocksForRange({
    idColaborador,
    startDate,
    endDate,
    models,
    config,
  });

  // Conflictos por traslape
  const conflicts = findDateRangeConflicts({
    newKind: "VACATION",
    newStartDate: startDate,
    newEndDate: endDate,
    existingBlocks,
    tz: template.timezone,
  });

  if (conflicts.hasConflicts) {
    return {
      allowed: false,
      reason: "DATE_CONFLICT",
      conflicts: conflicts.conflicts,
    };
  }

  // Días que descuentan
  const charge = computeChargeableVacationDays({
    startDate,
    endDate,
    template,
    holidaysMap,
  });

  // Validar saldo
  const diasDisponibles =
    Number(saldoVacaciones.dias_ganados) - Number(saldoVacaciones.dias_tomados);

  if (charge.chargeableDays > diasDisponibles) {
    return {
      allowed: false,
      reason: "INSUFFICIENT_BALANCE",
      available: diasDisponibles,
      required: charge.chargeableDays,
      details: charge,
    };
  }

  return {
    allowed: true,
    chargeableDays: charge.chargeableDays,
    chargeableDates: charge.chargeableDates,
    skippedDates: charge.skippedDates,
  };
}
