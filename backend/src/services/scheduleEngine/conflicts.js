import { rangesOverlap } from "./dateRange.js";

/**
 * @typedef {Object} ExistingBlock
 * @property {string} kind - "VACATION" | "LEAVE" | "SICKNESS"
 * @property {string} startDate - YYYY-MM-DD
 * @property {string} endDate - YYYY-MM-DD
 * @property {number|string} [id]
 * @property {number|string} [status]
 */

/**
 * Detecta traslapes inclusivos.
 *
 * @param {Object} params
 * @param {string} params.newKind
 * @param {string} params.newStartDate
 * @param {string} params.newEndDate
 * @param {ExistingBlock[]} params.existingBlocks
 * @param {string} [params.tz]
 */
export function findDateRangeConflicts({
  newKind,
  newStartDate,
  newEndDate,
  existingBlocks,
  tz = "America/Costa_Rica",
}) {
  const conflicts = [];

  for (const blk of existingBlocks || []) {
    const overlap = rangesOverlap({
      aStart: newStartDate,
      aEnd: newEndDate,
      bStart: blk.startDate,
      bEnd: blk.endDate,
      tz,
    });

    if (overlap) {
      conflicts.push({
        withKind: blk.kind,
        withId: blk.id ?? null,
        withStatus: blk.status ?? null,
        range: { startDate: blk.startDate, endDate: blk.endDate },
      });
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}
