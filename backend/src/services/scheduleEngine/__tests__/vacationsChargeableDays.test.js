import { buildScheduleTemplateFromHorario } from "../templateFromSchedule.js";
import { computeChargeableVacationDays } from "../vacationsChargeableDays.js";

describe("computeChargeableVacationDays (Flujo A)", () => {
  const tpl = buildScheduleTemplateFromHorario({
    hora_inicio: "08:00:00",
    hora_fin: "17:00:00",
    dias_laborales: "LKMJV",
    dias_libres: "SD",
    timezone: "America/Costa_Rica",
  });

  test("No descuenta sábados ni domingos", () => {
    const res = computeChargeableVacationDays({
      startDate: "2026-01-24",
      endDate: "2026-01-25",
      template: tpl,
      holidaysMap: new Map(),
    });

    expect(res.chargeableDays).toBe(0);
    expect(res.chargeableDates).toEqual([]);
    expect(res.skippedDates.map((x) => x.reason)).toEqual(["REST_DAY", "REST_DAY"]);
  });

  test("Rango mixto con feriado en medio", () => {
    const holidaysMap = new Map([
      ["2026-01-21", { nombre: "Feriado X", es_obligatorio: 1 }],
    ]);

    const res = computeChargeableVacationDays({
      startDate: "2026-01-19",
      endDate: "2026-01-23",
      template: tpl,
      holidaysMap,
    });

    // Lun, Mar, (Mié feriado), Jue, Vie => descuentan 4
    expect(res.chargeableDays).toBe(4);
    expect(res.chargeableDates).toEqual([
      "2026-01-19",
      "2026-01-20",
      "2026-01-22",
      "2026-01-23",
    ]);

    expect(res.skippedDates).toEqual([
      { date: "2026-01-21", reason: "HOLIDAY", holiday: "Feriado X" },
    ]);
  });

  test("Si startDate > endDate lanza error", () => {
    expect(() =>
      computeChargeableVacationDays({
        startDate: "2026-01-23",
        endDate: "2026-01-19",
        template: tpl,
        holidaysMap: new Map(),
      })
    ).toThrow();
  });
});
