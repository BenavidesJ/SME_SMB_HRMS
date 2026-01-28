import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { loadActiveContractAndTemplate, loadHolidaysMap } from "./providers/sequelizeScheduleProvider.js";
import { computeChargeableVacationDays } from "./vacationsChargeableDays.js";
import { assertNoIncapacityOverlapRange } from "./incapacityGuard.js";
import { assertNoLeaveOverlapRange } from "./leaveGuard.js";
import { assertNoVacationOverlapRange } from "./vacationGuard.js";
import { computeDiasGanadosVacaciones } from "./vacationsPolicy.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export async function validateVacationRequestAndCompute({
  idColaborador,
  startDate,
  endDate,
  models,
  config,
  estadoIds,
  saldoVacaciones,
  transaction,
}) {
  if (!idColaborador) throw new Error("validateVacationRequestAndCompute: idColaborador requerido");
  if (!startDate || !endDate) throw new Error("validateVacationRequestAndCompute: start/end requeridos");
  if (!models) throw new Error("validateVacationRequestAndCompute: models requerido");
  if (!saldoVacaciones) throw new Error("validateVacationRequestAndCompute: saldoVacaciones requerido");

  const { template, contrato } = await loadActiveContractAndTemplate({
    idColaborador: Number(idColaborador),
    models,
    config,
  });

  const tz = template.timezone || "America/Costa_Rica";

  const holidaysMap = await loadHolidaysMap({
    startDate,
    endDate,
    models: { Feriado: models.Feriado },
  });

  // Bloqueo con incapacidades
  await assertNoIncapacityOverlapRange({
    models: { Incapacidad: models.Incapacidad },
    idColaborador: Number(idColaborador),
    fecha_inicio: startDate,
    fecha_fin: endDate,
    transaction,
  });

  // Bloqueo con permisos (estado pendiente o aprobado)
  await assertNoLeaveOverlapRange({
    models: { SolicitudPermisosLicencias: models.SolicitudPermisosLicencias, Estado: models.Estado },
    idColaborador: Number(idColaborador),
    fecha_inicio: dayjs.tz(startDate, tz).startOf("day").toDate(),
    fecha_fin: dayjs.tz(endDate, tz).endOf("day").toDate(),
    transaction,
  });

  // Bloqueo con vacaciones (estado pendiente o aprobado)
  await assertNoVacationOverlapRange({
    models: { SolicitudVacaciones: models.SolicitudVacaciones },
    idColaborador: Number(idColaborador),
    startDate,
    endDate,
    pendingEstadoIds: [estadoIds.PENDIENTE],
    approvedEstadoIds: [estadoIds.APROBADO],
    transaction,
  });

  // Días que descuentan saldo
  const charge = computeChargeableVacationDays({
    startDate,
    endDate,
    template,
    holidaysMap,
  });

  // Recalcular ganados según contrato
  const todayDate = dayjs().tz(tz).format("YYYY-MM-DD");
  const earned = computeDiasGanadosVacaciones({
    contratoFechaInicio: String(contrato.fecha_inicio),
    todayDate,
    tz,
  });

  const dias_ganados_next = Number(earned.dias_ganados);
  const dias_tomados_actual = Number(saldoVacaciones.dias_tomados || 0);
  const disponibles = dias_ganados_next - dias_tomados_actual;

  if (charge.chargeableDays > disponibles) {
    return {
      allowed: false,
      reason: "BALANCE_INSUFICIENTE",
      available: disponibles,
      required: charge.chargeableDays,
      charge,
      earned,
    };
  }

  return {
    allowed: true,
    template,
    holidaysMap,
    charge,
    earned,
    disponibles,
  };
}
