import { Op } from "sequelize";
import { jest } from "@jest/globals";
import { loadExistingBlocksForRange } from "../sequelizeBlocksProvider.js";

describe("sequelizeBlocksProvider (mocked)", () => {
  test("retorna bloques VACATION y SICKNESS que traslapan", async () => {
    const SolicitudVacaciones = { findAll: jest.fn() };
    const Incapacidad = { findAll: jest.fn() };

    SolicitudVacaciones.findAll.mockResolvedValue([
      {
        id_solicitud_vacaciones: 1,
        estado_solicitud: 2,
        fecha_inicio: "2026-01-10",
        fecha_fin: "2026-01-12",
      },
    ]);

    Incapacidad.findAll.mockResolvedValue([
      {
        id_incapacidad: 9,
        fecha_inicio: "2026-01-20",
        fecha_fin: "2026-01-22",
      },
    ]);

    const blocks = await loadExistingBlocksForRange({
      idColaborador: 99,
      startDate: "2026-01-11",
      endDate: "2026-01-21",
      models: { SolicitudVacaciones, Incapacidad },
      config: {
        timezone: "America/Costa_Rica",
        vacationBlockStatusIds: [2],
      },
    });

    expect(blocks).toHaveLength(2);

    const kinds = blocks.map((b) => b.kind).sort();
    expect(kinds).toEqual(["SICKNESS", "VACATION"]);
  });

  test("filtra estados si vacationBlockStatusIds se define", async () => {
    const SolicitudVacaciones = { findAll: jest.fn().mockResolvedValue([]) };
    const Incapacidad = { findAll: jest.fn().mockResolvedValue([]) };

    await loadExistingBlocksForRange({
      idColaborador: 99,
      startDate: "2026-01-11",
      endDate: "2026-01-21",
      models: { SolicitudVacaciones, Incapacidad },
      config: {
        vacationBlockStatusIds: [1, 2],
      },
    });

    const call = SolicitudVacaciones.findAll.mock.calls[0][0];
    expect(call.where.estado_solicitud[Op.in]).toEqual([1, 2]);
  });
});
