import { buildScheduleTemplateFromHorario } from "../templateFromSchedule.js";
import {
  validateMaxDailyMinutesForInterval,
  validateRealWindowsForTimestamp,
} from "../realLimits.js";

describe("realLimits", () => {
  test("maxDailyMinutes: permite 12h exactas", () => {
    const template = buildScheduleTemplateFromHorario({
      hora_inicio: "08:00:00",
      hora_fin: "17:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
      minutos_descanso: 0,
      timezone: "America/Costa_Rica",
      max_horas_diarias: 12,
    });

    expect(() =>
      validateMaxDailyMinutesForInterval({
        entradaTs: "2026-01-20T08:00:00-06:00",
        salidaTs: "2026-01-20T20:00:00-06:00", // 12h
        dateStr: "2026-01-20",
        template,
      })
    ).not.toThrow();
  });

  test("maxDailyMinutes: bloquea 14h", () => {
    const template = buildScheduleTemplateFromHorario({
      hora_inicio: "08:00:00",
      hora_fin: "17:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
      minutos_descanso: 0,
      timezone: "America/Costa_Rica",
      max_horas_diarias: 12,
    });

    expect(() =>
      validateMaxDailyMinutesForInterval({
        entradaTs: "2026-01-20T08:00:00-06:00",
        salidaTs: "2026-01-20T22:00:00-06:00", // 14h
        dateStr: "2026-01-20",
        template,
      })
    ).toThrow(/excede máximo diario/);
  });

  test("realWindowsByDay: bloquea marca fuera de ventana real", () => {
    // realEndMin=1200 => 20:00
    const template = buildScheduleTemplateFromHorario({
      hora_inicio: "08:00:00",
      hora_fin: "17:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
      minutos_descanso: 0,
      timezone: "America/Costa_Rica",
      realEndMin: 1200,
    });

    // 21:00 => 1260 => fuera
    expect(() =>
      validateRealWindowsForTimestamp({
        timestamp: "2026-01-21T21:00:00-06:00",
        template,
      })
    ).toThrow(/fuera de ventana real/);
  });
});
