import { describe, test, expect, jest } from "@jest/globals";
import {
  assertNoIncapacityCoveringDate,
  assertNoIncapacityOverlapRange,
  IncapacityBlockedError,
} from "../incapacityGuard.js";

describe("incapacityGuard", () => {
  test("assertNoIncapacityCoveringDate: NO lanza si no hay incapacidad", async () => {
    const models = {
      Incapacidad: {
        findOne: jest.fn().mockResolvedValue(null),
      },
    };

    await expect(
      assertNoIncapacityCoveringDate({
        models,
        idColaborador: 10,
        dateStr: "2026-02-10",
        transaction: null,
      })
    ).resolves.toBeUndefined();

    expect(models.Incapacidad.findOne).toHaveBeenCalledTimes(1);
  });

  test("assertNoIncapacityCoveringDate: lanza si hay incapacidad", async () => {
    const models = {
      Incapacidad: {
        findOne: jest.fn().mockResolvedValue({ id_incapacidad: 1 }),
      },
    };

    await expect(
      assertNoIncapacityCoveringDate({
        models,
        idColaborador: 10,
        dateStr: "2026-02-10",
        transaction: null,
      })
    ).rejects.toBeInstanceOf(IncapacityBlockedError);
  });

  test("assertNoIncapacityOverlapRange: NO lanza si no hay traslape", async () => {
    const models = {
      Incapacidad: {
        findOne: jest.fn().mockResolvedValue(null),
      },
    };

    await expect(
      assertNoIncapacityOverlapRange({
        models,
        idColaborador: 10,
        fecha_inicio: "2026-02-01",
        fecha_fin: "2026-02-05",
        excludeId: null,
        transaction: null,
      })
    ).resolves.toBeUndefined();

    expect(models.Incapacidad.findOne).toHaveBeenCalledTimes(1);
  });

  test("assertNoIncapacityOverlapRange: lanza si hay traslape", async () => {
    const models = {
      Incapacidad: {
        findOne: jest.fn().mockResolvedValue({ id_incapacidad: 99 }),
      },
    };

    await expect(
      assertNoIncapacityOverlapRange({
        models,
        idColaborador: 10,
        fecha_inicio: "2026-02-01",
        fecha_fin: "2026-02-05",
        excludeId: null,
        transaction: null,
      })
    ).rejects.toMatchObject({
      name: "IncapacityBlockedError",
      code: "BLOQUEADO_POR_INCAPACIDAD",
    });
  });
});
