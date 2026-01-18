import { buildScheduleTemplateFromHorario } from "../templateFromSchedule.js";
import { classifyWorkedIntervalForDay } from "../attendanceClassifier.js";

describe("attendanceClassifier", () => {
  const tpl = buildScheduleTemplateFromHorario({
    hora_inicio: "08:00:00",
    hora_fin: "17:00:00",
    dias_laborales: "LKMJV",
    dias_libres: "SD",
    minutos_descanso: 60,
    timezone: "America/Costa_Rica",
  });

  test("Día laborable: 08:00-17:00 con 60 min descanso => 8h ordinarias, 0 extra", () => {
    const res = classifyWorkedIntervalForDay({
      entradaTs: "2026-01-19 08:00:00",
      salidaTs: "2026-01-19 17:00:00",
      dateStr: "2026-01-19",
      template: tpl,
    });

    expect(res.ordinaryHours).toBe(8);
    expect(res.extraHours).toBe(0);
  });

  test("Día laborable: 08:00-18:00 con 60 min descanso => 8h ordinarias, 1h extra", () => {
    const res = classifyWorkedIntervalForDay({
      entradaTs: "2026-01-19 08:00:00",
      salidaTs: "2026-01-19 18:00:00",
      dateStr: "2026-01-19",
      template: tpl,
    });

    expect(res.ordinaryHours).toBe(8);
    expect(res.extraHours).toBe(1);
    expect(res.warnings).toContain("SALIDA_TARDE_EXTRA");
  });

  test("Sábado: todo es extra (aunque haya 60 min descanso)", () => {
    const res = classifyWorkedIntervalForDay({
      entradaTs: "2026-01-24 08:00:00", // sábado
      salidaTs: "2026-01-24 12:00:00",
      dateStr: "2026-01-24",
      template: tpl,
    });

    // 4h - 1h descanso = 3h extra
    expect(res.ordinaryHours).toBe(0);
    expect(res.extraHours).toBe(3);
    expect(res.warnings).toContain("DIA_NO_LABORAL_CARGADO_COMO_EXTRA");
  });

  test("Cruza medianoche: 22:00-02:00 en template diurno => todo extra", () => {
    const res = classifyWorkedIntervalForDay({
      entradaTs: "2026-01-19 22:00:00",
      salidaTs: "2026-01-20 02:00:00",
      dateStr: "2026-01-19",
      template: tpl,
    });

    // 4h trabajadas - 1h descanso = 3h extra
    expect(res.ordinaryHours).toBe(0);
    expect(res.extraHours).toBe(3);
  });
});
