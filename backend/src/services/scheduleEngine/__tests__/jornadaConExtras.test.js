import { applyOvertimeApprovalPolicy } from "../overtimePolicy.js";

describe("jornada derivation - integración ligera - horas extra", () => {
  test("extra candidata 3.0, aprobadas 2.0 => persiste 2.0 y warning parcial", () => {
    const classified = {
      ordinaryHours: 8,
      extraHours: 3,
      warnings: ["SALIDA_TARDE_EXTRA"],
    };

    const overtime = applyOvertimeApprovalPolicy({
      extraCandidateHours: classified.extraHours,
      approvedHoursAvailable: 2,
    });

    const warnings = [...classified.warnings, ...overtime.warnings];

    const toPersist = {
      horas_trabajadas: classified.ordinaryHours,
      horas_extra: overtime.extraApprovedHours, 
      feriado_obligatorio: 1, 
    };

    expect(toPersist).toEqual({
      horas_trabajadas: 8,
      horas_extra: 2,
      feriado_obligatorio: 1,
    });

    expect(warnings).toContain("SALIDA_TARDE_EXTRA");
    expect(warnings).toContain("HORA_EXTRA_PARCIALMENTE_APROBADA");
  });

  test("extra candidata 1.5, aprobadas 0 => persiste 0 y warning no contabilizada", () => {
    const classified = {
      ordinaryHours: 8,
      extraHours: 1.5,
      warnings: ["SALIDA_TARDE_EXTRA"],
    };

    const overtime = applyOvertimeApprovalPolicy({
      extraCandidateHours: classified.extraHours,
      approvedHoursAvailable: 0,
    });

    const toPersist = {
      horas_trabajadas: classified.ordinaryHours,
      horas_extra: overtime.extraApprovedHours,
      feriado_obligatorio: 0,
    };

    expect(toPersist.horas_extra).toBe(0);
    expect(overtime.warnings).toContain("HORA_EXTRA_NO_CONTABILIZADA_SIN_APROBACION");
  });
});
