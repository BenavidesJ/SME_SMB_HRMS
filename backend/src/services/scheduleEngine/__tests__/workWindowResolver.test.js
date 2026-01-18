import { buildScheduleTemplateFromHorario } from "../templateFromSchedule.js";
import { resolveWorkWindowForTimestamp } from "../workWindowResolver.js";

describe("workWindowResolver", () => {
  test("Diurno: ventana es el día calendario", () => {
    const tpl = buildScheduleTemplateFromHorario({
      hora_inicio: "08:00:00",
      hora_fin: "17:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
      minutos_descanso: 0,
      timezone: "America/Costa_Rica",
    });

    const { windowDateStr } = resolveWorkWindowForTimestamp({
      timestamp: "2026-01-07T08:00:00-06:00",
      template: tpl,
    });

    expect(windowDateStr).toBe("2026-01-07");
  });

  test("Nocturno: 02:00 pertenece a la ventana iniciada el día anterior", () => {
    const tpl = buildScheduleTemplateFromHorario({
      hora_inicio: "22:00:00",
      hora_fin: "06:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
      minutos_descanso: 0,
      timezone: "America/Costa_Rica",
    });

    const { windowDateStr } = resolveWorkWindowForTimestamp({
      timestamp: "2026-01-07T02:00:00-06:00",
      template: tpl,
    });

    expect(windowDateStr).toBe("2026-01-06");
  });

  test("Nocturno: 23:00 pertenece a la ventana iniciada ese mismo día", () => {
    const tpl = buildScheduleTemplateFromHorario({
      hora_inicio: "22:00:00",
      hora_fin: "06:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
      minutos_descanso: 0,
      timezone: "America/Costa_Rica",
    });

    const { windowDateStr } = resolveWorkWindowForTimestamp({
      timestamp: "2026-01-07T23:00:00-06:00",
      template: tpl,
    });

    expect(windowDateStr).toBe("2026-01-07");
  });
});
