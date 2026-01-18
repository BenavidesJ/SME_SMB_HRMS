import { jest } from "@jest/globals";
import { isMandatoryHolidayByDate } from "../sequelizeHolidayProvider.js";

describe("sequelizeHolidayProvider (mocked)", () => {
  test("si no existe feriado => retorna 0", async () => {
    const Feriado = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const res = await isMandatoryHolidayByDate({
      models: { Feriado },
      dateStr: "2026-02-26",
    });

    expect(Feriado.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { fecha: "2026-02-26" },
      })
    );
    expect(res).toBe(0);
  });

  test("si existe feriado NO obligatorio => retorna 0", async () => {
    const Feriado = {
      findOne: jest.fn().mockResolvedValue({ es_obligatorio: false }),
    };

    const res = await isMandatoryHolidayByDate({
      models: { Feriado },
      dateStr: "2026-05-01",
    });

    expect(res).toBe(0);
  });

  test("si existe feriado obligatorio => retorna 1", async () => {
    const Feriado = {
      findOne: jest.fn().mockResolvedValue({ es_obligatorio: true }),
    };

    const res = await isMandatoryHolidayByDate({
      models: { Feriado },
      dateStr: "2026-05-01",
    });

    expect(res).toBe(1);
  });
});
