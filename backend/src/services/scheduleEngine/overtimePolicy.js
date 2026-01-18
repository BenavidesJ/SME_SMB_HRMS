/**
 * Aplica la política:
 * - La extra candidata existe por horario
 * - Solo se contabiliza si hay horas aprobadas (previas) para esa fecha
 *
 * @param {{
 *  extraCandidateHours: number,
 *  approvedHoursAvailable: number
 * }} params
 */
export function applyOvertimeApprovalPolicy({
  extraCandidateHours,
  approvedHoursAvailable,
}) {
  const candidate = Number(extraCandidateHours) || 0;
  const approvedAvail = Number(approvedHoursAvailable) || 0;

  const approved = Math.max(0, Math.min(candidate, approvedAvail));
  const unapproved = Math.max(0, candidate - approved);

  const warnings = [];
  if (candidate > 0 && approved === 0) {
    warnings.push("HORA_EXTRA_NO_CONTABILIZADA_SIN_APROBACION");
  }
  if (candidate > 0 && approved > 0 && unapproved > 0) {
    warnings.push("HORA_EXTRA_PARCIALMENTE_APROBADA");
  }

  return {
    extraCandidateHours: round2(candidate),
    extraApprovedHours: round2(approved),
    extraUnapprovedHours: round2(unapproved),
    warnings,
  };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
