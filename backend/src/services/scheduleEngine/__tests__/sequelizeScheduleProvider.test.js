import { jest } from "@jest/globals";
import {
  loadActiveContractAndTemplate,
  loadHolidaysMap,
} from "../sequelizeScheduleProvider.js";

describe("sequelizeScheduleProvider (mocked)", () => {
  test("loadActiveContractAndTemplate devuelve contrato, horario y template", async () => {
    const Contrato = {
      findOne: jest.fn(),
    };

    const HorarioLaboral = {
      findOne: jest.fn(),
    };

    Contrato.findOne.mockResolvedValue({
      id_contrato: 10,
      id_colaborador: 99,
      fecha_inicio: "2026-01-01",
      estado: 1,
    });

    HorarioLaboral.findOne.mockResolvedValue({
      id_contrato: 10,
      hora_inicio: "08:00:00",
      hora_fin: "17:00:00",
      dias_laborales: "LKMJV",
      dias_libres: "SD",
      minutos_descanso: 0,
      id_tipo_jornada: 1,
      estado: 1,
      fecha_actualizacion: "2026-01-01",
    });

    const models = { Contrato, HorarioLaboral };

    const res = await loadActiveContractAndTemplate({
      idColaborador: 99,
      models,
      config: {
        contratoActivoIds: [1],
        horarioActivoIds: [1],
      },
    });

    expect(res.contrato.id_contrato).toBe(10);
    expect(res.horario.id_contrato).toBe(10);

    expect(res.template.timezone).toBe("America/Costa_Rica");
    expect(res.template.restDays).toEqual([5, 6]); // S,D
    expect(res.template.virtualWindowsByDay[0]).toEqual([{ start: 480, end: 1020 }]); // Lunes 8-17
  });

  test("loadActiveContractAndTemplate lanza error si no hay contrato activo", async () => {
    const models = {
      Contrato: { findOne: jest.fn().mockResolvedValue(null) },
      HorarioLaboral: { findOne: jest.fn() },
    };

    await expect(
      loadActiveContractAndTemplate({
        idColaborador: 99,
        models,
        config: { contratoActivoIds: [1], horarioActivoIds: [1] },
      })
    ).rejects.toThrow("No hay contrato activo");
  });

  test("loadActiveContractAndTemplate lanza error si no hay horario activo", async () => {
    const models = {
      Contrato: { findOne: jest.fn().mockResolvedValue({ id_contrato: 10 }) },
      HorarioLaboral: { findOne: jest.fn().mockResolvedValue(null) },
    };

    await expect(
      loadActiveContractAndTemplate({
        idColaborador: 99,
        models,
        config: { contratoActivoIds: [1], horarioActivoIds: [1] },
      })
    ).rejects.toThrow("No hay horario laboral activo");
  });

  test("loadHolidaysMap devuelve Map con fechas", async () => {
    const Feriado = {
      findAll: jest.fn(),
    };

    Feriado.findAll.mockResolvedValue([
      { fecha: "2026-01-01", nombre: "Año Nuevo", es_obligatorio: true },
      { fecha: "2026-04-02", nombre: "Jueves Santo", es_obligatorio: true },
    ]);

    const map = await loadHolidaysMap({
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      models: { Feriado },
    });

    expect(map).toBeInstanceOf(Map);
    expect(map.has("2026-01-01")).toBe(true);
    expect(map.get("2026-01-01")).toEqual({
      nombre: "Año Nuevo",
      es_obligatorio: 1,
    });
  });
});
