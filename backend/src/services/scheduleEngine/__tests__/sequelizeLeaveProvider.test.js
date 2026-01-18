import { describe, test, expect, jest } from "@jest/globals";
import { hasLeaveOverlap } from "../sequelizeLeaveProvider.js";

describe("sequelizeLeaveProvider.hasLeaveOverlap (mocked)", () => {
  test("true cuando encuentra traslape", async () => {
    const SolicitudPermisosLicencias = {
      findOne: jest.fn().mockResolvedValue({ id_solicitud: 1 }),
    };

    const models = { SolicitudPermisosLicencias };

    const res = await hasLeaveOverlap({
      models,
      idColaborador: 10,
      fecha_inicio: new Date("2026-01-20T08:00:00.000Z"),
      fecha_fin: new Date("2026-01-20T10:00:00.000Z"),
      blockingStatusIds: [1, 2],
      transaction: null,
    });

    expect(res).toBe(true);
    expect(SolicitudPermisosLicencias.findOne).toHaveBeenCalledTimes(1);
  });

  test("false cuando no encuentra traslape", async () => {
    const SolicitudPermisosLicencias = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    const models = { SolicitudPermisosLicencias };

    const res = await hasLeaveOverlap({
      models,
      idColaborador: 10,
      fecha_inicio: new Date("2026-01-20T08:00:00.000Z"),
      fecha_fin: new Date("2026-01-20T10:00:00.000Z"),
      blockingStatusIds: [1, 2],
      transaction: null,
    });

    expect(res).toBe(false);
  });
});
