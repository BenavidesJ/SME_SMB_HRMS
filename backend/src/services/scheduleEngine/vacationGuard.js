import { hasVacationOverlapByDateRange } from "./providers/sequelizeVacationProvider.js";

export class VacationBlockedError extends Error {
  constructor(message = "BLOQUEADO_POR_VACACIONES") {
    super(message);
    this.name = "VacationBlockedError";
    this.code = "BLOQUEADO_POR_VACACIONES";
    this.httpStatus = 400;
  }
}

export async function assertNoVacationOverlapRange({
  models,
  idColaborador,
  startDate,
  endDate,
  pendingEstadoIds,
  approvedEstadoIds,
  excludeId = null,
  transaction,
}) {
  const overlapped = await hasVacationOverlapByDateRange({
    models,
    idColaborador,
    startDate,
    endDate,
    pendingEstadoIds,
    approvedEstadoIds,
    excludeId,
    transaction,
  });

  if (overlapped) {
    throw new VacationBlockedError(
      `BLOQUEADO_POR_VACACIONES: existe traslape en rango ${startDate}..${endDate}`
    );
  }
}
