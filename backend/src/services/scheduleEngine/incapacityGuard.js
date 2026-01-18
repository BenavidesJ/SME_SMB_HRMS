import { existsIncapacityCoveringDate, hasIncapacityOverlap } from "./sequelizeIncapacityProvider.js";

/**
 * Error estándar del engine para bloqueo por incapacidad.
 */
export class IncapacityBlockedError extends Error {
  constructor(message = "BLOQUEADO_POR_INCAPACIDAD") {
    super(message);
    this.name = "IncapacityBlockedError";
    this.code = "BLOQUEADO_POR_INCAPACIDAD";
    this.httpStatus = 400;
  }
}

/**
 * Bloquea una operación si la fecha (YYYY-MM-DD) está cubierta por una incapacidad.
 *
 */
export async function assertNoIncapacityCoveringDate({
  models,
  idColaborador,
  dateStr,
  transaction,
}) {
  const blocked = await existsIncapacityCoveringDate({
    models,
    idColaborador,
    dateStr,
    transaction,
  });

  if (blocked) {
    throw new IncapacityBlockedError(
      `BLOQUEADO_POR_INCAPACIDAD: el colaborador tiene incapacidad activa en ${dateStr}`
    );
  }
}

/**
 * Bloquea una operación si un rango [fecha_inicio, fecha_fin] se traslapa con una incapacidad.
 *
 */
export async function assertNoIncapacityOverlapRange({
  models,
  idColaborador,
  fecha_inicio,
  fecha_fin,
  transaction,
  excludeId = null,
}) {
  const overlapped = await hasIncapacityOverlap({
    models,
    idColaborador,
    fecha_inicio,
    fecha_fin,
    excludeId,
    transaction,
  });

  if (overlapped) {
    throw new IncapacityBlockedError(
      `BLOQUEADO_POR_INCAPACIDAD: existe traslape con incapacidad en rango ${fecha_inicio}..${fecha_fin}`
    );
  }
}
