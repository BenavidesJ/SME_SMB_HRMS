import { applyOvertimeApprovalPolicy } from "../overtimePolicy.js";

describe("overtimePolicy", () => {
  test("sin aprobación: candidata > 0 => aprobada 0 y warning semántico", () => {
    const r = applyOvertimeApprovalPolicy({
      extraCandidateHours: 2.5,
      approvedHoursAvailable: 0,
    });

    expect(r.extraApprovedHours).toBe(0);
    expect(r.extraUnapprovedHours).toBe(2.5);
    expect(r.warnings).toContain("HORA_EXTRA_NO_CONTABILIZADA_SIN_APROBACION");
  });

  test("aprobación parcial: candidata 5, aprobadas 2 => aprobada 2", () => {
    const r = applyOvertimeApprovalPolicy({
      extraCandidateHours: 5,
      approvedHoursAvailable: 2,
    });

    expect(r.extraApprovedHours).toBe(2);
    expect(r.extraUnapprovedHours).toBe(3);
    expect(r.warnings).toContain("HORA_EXTRA_PARCIALMENTE_APROBADA");
  });

  test("aprobación completa: candidata 1.5, aprobadas 3 => aprobada 1.5", () => {
    const r = applyOvertimeApprovalPolicy({
      extraCandidateHours: 1.5,
      approvedHoursAvailable: 3,
    });

    expect(r.extraApprovedHours).toBe(1.5);
    expect(r.extraUnapprovedHours).toBe(0);
    expect(r.warnings.length).toBe(0);
  });
});
