import { describe, test, expect } from "@jest/globals";
import {
  computeIncapacityPolicy,
  toIncapacityDbFields,
  INCAPACITY_TYPES,
} from "../incapacityPolicy.js";

describe("incapacityPolicy", () => {
  test("ENFERMEDAD: guarda tramo principal (día 4+) como 0% patrono, 60% CCSS", () => {
    const r = computeIncapacityPolicy({
      tipoNombre: "ENFERMEDAD",
      fecha_inicio: "2026-02-02",
      fecha_fin: "2026-02-13",
    });

    expect(r.tipo).toBe(INCAPACITY_TYPES.ENFERMEDAD);
    expect(r.totalDays).toBe(10);

    expect(r.porcentaje_patrono).toBe(0);
    expect(r.porcentaje_ccss).toBe(60);

    expect(r.meta.firstDaysEmployerPercent).toBe(50);
    expect(r.meta.firstDaysCount).toBe(3);
    expect(r.meta.fromDay).toBe(4);
    expect(Array.isArray(r.meta.notes)).toBe(true);
  });

  test("ENFERMEDAD: viernes y lunes (sin contar sábado/domingo) => 2 días", () => {
    const r = computeIncapacityPolicy({
      tipoNombre: "ENFERMEDAD",
      fecha_inicio: "2026-02-06", 
      fecha_fin: "2026-02-09", 
    });

    expect(r.totalDays).toBe(2);
    expect(r.porcentaje_patrono).toBe(50);
    expect(r.porcentaje_ccss).toBe(0);
  });

  test("ACCIDENTE_TRANSITO: tratado como ENFERMEDAD", () => {
    const r = computeIncapacityPolicy({
      tipoNombre: "ACCIDENTE_TRANSITO",
      fecha_inicio: "2026-03-02",
      fecha_fin: "2026-03-06",
    });

    expect(r.tipo).toBe(INCAPACITY_TYPES.ACCIDENTE_TRANSITO);
    expect(r.totalDays).toBe(5);
    expect(r.porcentaje_patrono).toBe(0);
    expect(r.porcentaje_ccss).toBe(60);
  });

  test("MATERNIDAD: 50/50 y avisa si excede 123 días (calendario)", () => {
    const ok = computeIncapacityPolicy({
      tipoNombre: "MATERNIDAD",
      fecha_inicio: "2026-01-01",
      fecha_fin: "2026-05-03",
    });

    expect(ok.tipo).toBe(INCAPACITY_TYPES.MATERNIDAD);
    expect(ok.porcentaje_patrono).toBe(50);
    expect(ok.porcentaje_ccss).toBe(50);

    const long = computeIncapacityPolicy({
      tipoNombre: "MATERNIDAD",
      fecha_inicio: "2026-01-01",
      fecha_fin: "2026-06-30",
    });

    expect(long.porcentaje_patrono).toBe(50);
    expect(long.porcentaje_ccss).toBe(50);
    expect(long.meta.notes.some((n) => n.includes("123"))).toBe(true);
  });

  test("toIncapacityDbFields valida rangos 0..100", () => {
    const r = computeIncapacityPolicy({
      tipoNombre: "ENFERMEDAD",
      fecha_inicio: "2026-02-02",
      fecha_fin: "2026-02-13",
    });

    const fields = toIncapacityDbFields(r);
    expect(fields).toEqual({ porcentaje_patrono: 0, porcentaje_ccss: 60 });

    expect(() =>
      toIncapacityDbFields({ porcentaje_patrono: 999, porcentaje_ccss: 60 })
    ).toThrow(/porcentaje_patrono/i);
  });

  test("fecha_fin < fecha_inicio => error", () => {
    expect(() =>
      computeIncapacityPolicy({
        tipoNombre: "ENFERMEDAD",
        fecha_inicio: "2026-02-10",
        fecha_fin: "2026-02-01",
      })
    ).toThrow(/fecha_fin/i);
  });

  test("tipo no soportado => error", () => {
    expect(() =>
      computeIncapacityPolicy({
        tipoNombre: "OTRO",
        fecha_inicio: "2026-02-01",
        fecha_fin: "2026-02-02",
      })
    ).toThrow(/no soportado/i);
  });

  test("dateStr inválido => error", () => {
    expect(() =>
      computeIncapacityPolicy({
        tipoNombre: "ENFERMEDAD",
        fecha_inicio: "2026-2-1",
        fecha_fin: "2026-02-02",
      })
    ).toThrow(/YYYY-MM-DD/i);
  });

  test("dias_descanso inválido => error", () => {
    expect(() =>
      computeIncapacityPolicy({
        tipoNombre: "ENFERMEDAD",
        fecha_inicio: "2026-02-01",
        fecha_fin: "2026-02-02",
        dias_descanso: [9],
      })
    ).toThrow(/dias_descanso/i);
  });
});
