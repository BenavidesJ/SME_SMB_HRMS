import { buildScheduleTemplateFromHorario } from "../templateFromSchedule.js";
import { getDayContext } from "../dayContext.js";

describe("getDayContext", () => {
  const tpl = buildScheduleTemplateFromHorario({
    hora_inicio: "08:00:00",
    hora_fin: "17:00:00",
    dias_laborales: "LKMJV",
    dias_libres: "SD",
  });

  test("Lunes laborable, no feriado", () => {
    const holidaysMap = new Map();
    const ctx = getDayContext({
      dateStr: "2026-01-19", // Lunes
      template: tpl,
      holidaysMap,
    });

    expect(ctx.dayIndex).toBe(0);
    expect(ctx.isWorkday).toBe(true);
    expect(ctx.isRestDay).toBe(false);
    expect(ctx.isHoliday).toBe(false);
  });

  test("Sábado es descanso y no laborable", () => {
    const ctx = getDayContext({
      dateStr: "2026-01-24", // Sábado
      template: tpl,
      holidaysMap: new Map(),
    });

    expect(ctx.dayIndex).toBe(5);
    expect(ctx.isRestDay).toBe(true);
    expect(ctx.isWorkday).toBe(false);
  });

  test("Feriado detectado por fecha", () => {
    const holidaysMap = new Map([
      ["2026-01-20", { nombre: "Feriado X", es_obligatorio: 1 }],
    ]);

    const ctx = getDayContext({
      dateStr: "2026-01-20",
      template: tpl,
      holidaysMap,
    });

    expect(ctx.isHoliday).toBe(true);
    expect(ctx.holidayInfo.nombre).toBe("Feriado X");
  });
});
