import { buildScheduleTemplateFromHorario } from "../templateFromSchedule.js";
import { validateLeaveByDateRange } from "../leavesByDateRange.js";

describe("validateLeaveByDateRange (DATEONLY)", () => {
  const tpl = buildScheduleTemplateFromHorario({
    hora_inicio: "08:00:00",
    hora_fin: "17:00:00",
    dias_laborales: "LKMJV",
    dias_libres: "SD",
    timezone: "America/Costa_Rica",
  });

  test("Permiso de 1 día laborable permitido", () => {
    const res = validateLeaveByDateRange({
      startDate: "2026-01-19", // lunes
      endDate: "2026-01-19",
      template: tpl,
      holidaysMap: new Map(),
      todayDate: "2026-01-16",
    });

    expect(res.allowed).toBe(true);
    expect(res.effectiveDates).toEqual(["2026-01-19"]);
    expect(res.violations).toEqual([]);
  });

  test("Permiso en sábado bloqueado", () => {
    const res = validateLeaveByDateRange({
      startDate: "2026-01-24", // sábado
      endDate: "2026-01-24",
      template: tpl,
      holidaysMap: new Map(),
      todayDate: "2026-01-16",
    });

    expect(res.allowed).toBe(false);
    expect(res.violations[0].code).toBe("REST_DAY");
  });

  test("Permiso en feriado bloqueado", () => {
    const holidaysMap = new Map([
      ["2026-01-20", { nombre: "Feriado X", es_obligatorio: 1 }],
    ]);

    const res = validateLeaveByDateRange({
      startDate: "2026-01-20",
      endDate: "2026-01-20",
      template: tpl,
      holidaysMap,
      todayDate: "2026-01-16",
    });

    expect(res.allowed).toBe(false);
    expect(res.violations[0].code).toBe("HOLIDAY");
  });

  test("Permiso en el pasado bloqueado si todayDate se define", () => {
    const res = validateLeaveByDateRange({
      startDate: "2026-01-10",
      endDate: "2026-01-10",
      template: tpl,
      holidaysMap: new Map(),
      todayDate: "2026-01-16",
    });

    expect(res.allowed).toBe(false);
    expect(res.violations[0].code).toBe("PAST_DATE");
  });

  test("Rango mixto devuelve múltiples violaciones", () => {
    const holidaysMap = new Map([
      ["2026-01-21", { nombre: "Feriado X", es_obligatorio: 1 }], // miércoles
    ]);

    const res = validateLeaveByDateRange({
      startDate: "2026-01-20", // mar (laborable)
      endDate: "2026-01-25",   // dom (descanso)
      template: tpl,
      holidaysMap,
      todayDate: "2026-01-16",
    });

    expect(res.allowed).toBe(false);

    // Debe incluir HOLIDAY (21) y REST_DAY (24,25)
    const codes = res.violations.map(v => `${v.date}:${v.code}`);
    expect(codes).toContain("2026-01-21:HOLIDAY");
    expect(codes).toContain("2026-01-24:REST_DAY");
    expect(codes).toContain("2026-01-25:REST_DAY");
  });
});
