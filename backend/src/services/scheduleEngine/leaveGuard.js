import { hasLeaveOverlap } from "./sequelizeLeaveProvider.js";

export class LeaveBlockedError extends Error {
  constructor(message = "BLOQUEADO_POR_TRASLAPE_PERMISO") {
    super(message);
    this.name = "LeaveBlockedError";
    this.code = "BLOQUEADO_POR_TRASLAPE_PERMISO";
    this.httpStatus = 400;
  }
}

/**
 * Bloquea si existe traslape con otra solicitud.
 */
export async function assertNoLeaveOverlapRange({
  models,
  idColaborador,
  fecha_inicio,
  fecha_fin,
  blockingStatusIds,
  transaction,
  excludeId = null,
}) {
  const overlapped = await hasLeaveOverlap({
    models,
    idColaborador,
    fecha_inicio,
    fecha_fin,
    blockingStatusIds,
    transaction,
    excludeId,
  });

  if (overlapped) {
    throw new LeaveBlockedError(
      `BLOQUEADO_POR_TRASLAPE_PERMISO: existe traslape en ${String(fecha_inicio)}..${String(fecha_fin)}`
    );
  }
}
