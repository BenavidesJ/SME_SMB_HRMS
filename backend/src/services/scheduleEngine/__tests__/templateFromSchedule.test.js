import { buildScheduleTemplateFromHorario } from "../templateFromSchedule.js";

describe("buildScheduleTemplateFromHorario", () => {
  test("Diurno LKMJV 08:00-17:00 genera virtual Lun-Vie y restDays SD", () => {
    const tpl = buildScheduleTemplateFromHorario({
      hora_inicio: "08:00:00",
      hora_fin: "17:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
      minutos_descanso: 0,
      id_tipo_jornada: 1,
      timezone: "America/Costa_Rica",
    });

    expect(tpl.virtualWindowsByDay[0]).toEqual([{ start: 480, end: 1020 }]); // L
    expect(tpl.virtualWindowsByDay[1]).toEqual([{ start: 480, end: 1020 }]); // K
    expect(tpl.virtualWindowsByDay[2]).toEqual([{ start: 480, end: 1020 }]); // M
    expect(tpl.virtualWindowsByDay[3]).toEqual([{ start: 480, end: 1020 }]); // J
    expect(tpl.virtualWindowsByDay[4]).toEqual([{ start: 480, end: 1020 }]); // V
    expect(tpl.virtualWindowsByDay[5]).toEqual([]); // S
    expect(tpl.virtualWindowsByDay[6]).toEqual([]); // D

    expect(tpl.restDays).toEqual([5, 6]); // S, D
  });

  test("Nocturno 22:00-06:00 crea dos ventanas en cada día laborable", () => {
    const tpl = buildScheduleTemplateFromHorario({
      hora_inicio: "22:00:00",
      hora_fin: "06:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
      minutos_descanso: 0,
      id_tipo_jornada: 3,
    });

    // Lunes: [00:00-06:00) y [22:00-24:00)
    expect(tpl.virtualWindowsByDay[0]).toEqual([
      { start: 0, end: 360 },
      { start: 1320, end: 1440 },
    ]);
  });
});
