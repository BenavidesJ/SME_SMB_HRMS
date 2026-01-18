import { describe, test, expect } from "@jest/globals";
import { validateLeaveRequest } from "../leavePolicy.js";

function makeTemplate() {
  // L-V: 07:00-16:30 => 420..990
  const win = [{ start: 420, end: 990 }];
  return {
    timezone: "America/Costa_Rica",
    restDays: [5, 6], // S, D
    virtualWindowsByDay: {
      0: win, 1: win, 2: win, 3: win, 4: win,
      5: [], 6: [],
    },
  };
}

describe("leavePolicy.validateLeaveRequest", () => {
  test("mismo día dentro de ventana => allowed true y cantidades correctas", () => {
    const template = makeTemplate();
    const holidaysMap = new Map();

    const res = validateLeaveRequest({
      fecha_inicio: "2026-01-20T08:00:00-06:00",
      fecha_fin: "2026-01-20T12:00:00-06:00",
      template,
      holidaysMap,
      todayDate: "2026-01-10",
    });

    expect(res.allowed).toBe(true);
    expect(res.cantidad_dias).toBe(1);
    expect(res.cantidad_horas).toBe(4);
    expect(res.effectiveDates).toEqual(["2026-01-20"]);
  });

  test("mismo día fuera de ventana => bloquea", () => {
    const template = makeTemplate();
    const holidaysMap = new Map();

    const res = validateLeaveRequest({
      fecha_inicio: "2026-01-20T06:00:00-06:00",
      fecha_fin: "2026-01-20T08:00:00-06:00",
      template,
      holidaysMap,
      todayDate: "2026-01-10",
    });

    expect(res.allowed).toBe(false);
    expect(res.violations.some(v => String(v.code).includes("OUTSIDE_VIRTUAL"))).toBe(true);
  });

  test("multi-día: valida inicio/fin dentro de ventanas y calcula horas por ventanas", () => {
    const template = makeTemplate();
    const holidaysMap = new Map();

    // Día 1: 15:00-16:30 => 1.5h
    // Día 2: 07:00-09:00 => 2h
    // Total: 3.5h, días: 2
    const res = validateLeaveRequest({
      fecha_inicio: "2026-01-20T15:00:00-06:00",
      fecha_fin: "2026-01-21T09:00:00-06:00",
      template,
      holidaysMap,
      todayDate: "2026-01-10",
    });

    expect(res.allowed).toBe(true);
    expect(res.cantidad_dias).toBe(2);
    expect(res.cantidad_horas).toBe(3.5);
    expect(res.effectiveDates).toEqual(["2026-01-20", "2026-01-21"]);
  });
});
