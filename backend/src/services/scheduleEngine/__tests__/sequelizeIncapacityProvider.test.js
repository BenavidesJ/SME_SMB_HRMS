import { describe, test, expect, jest } from "@jest/globals";
import {
  loadIncapacityBlocksByDateRange,
  hasIncapacityOverlap,
} from "../sequelizeIncapacityProvider.js";

describe("sequelizeIncapacityProvider (mocked)", () => {
  test("loadIncapacityBlocksByDateRange: consulta por rango inclusivo y colaborador", async () => {
    const Incapacidad = {
      findAll: jest.fn().mockResolvedValue([{ id_incapacidad: 1 }]),
    };

    const models = { Incapacidad };

    const res = await loadIncapacityBlocksByDateRange({
      models,
      idColaborador: 99,
      fromDateStr: "2026-02-01",
      toDateStr: "2026-02-10",
      transaction: null,
    });

    expect(res).toEqual([{ id_incapacidad: 1 }]);
    expect(Incapacidad.findAll).toHaveBeenCalledTimes(1);

    const call = Incapacidad.findAll.mock.calls[0][0];
    expect(call.where.id_colaborador).toBe(99);
    expect(call.where).toHaveProperty("fecha_inicio");
    expect(call.where).toHaveProperty("fecha_fin");
  });

  test("hasIncapacityOverlap: true cuando hay traslape", async () => {
    const Incapacidad = {
      findOne: jest.fn().mockResolvedValue({ id_incapacidad: 7 }),
    };

    const models = { Incapacidad };

    const overlapped = await hasIncapacityOverlap({
      models,
      idColaborador: 10,
      fecha_inicio: "2026-02-01",
      fecha_fin: "2026-02-02",
      transaction: null,
    });

    expect(overlapped).toBe(true);
    expect(Incapacidad.findOne).toHaveBeenCalledTimes(1);
  });

  test("hasIncapacityOverlap: false cuando no hay traslape", async () => {
    const Incapacidad = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const models = { Incapacidad };

    const overlapped = await hasIncapacityOverlap({
      models,
      idColaborador: 10,
      fecha_inicio: "2026-02-01",
      fecha_fin: "2026-02-02",
      transaction: null,
    });

    expect(overlapped).toBe(false);
    expect(Incapacidad.findOne).toHaveBeenCalledTimes(1);
  });
});
