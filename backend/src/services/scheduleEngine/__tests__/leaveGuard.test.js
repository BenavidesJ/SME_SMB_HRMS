import { describe, test, expect, jest } from "@jest/globals";
import { assertNoLeaveOverlapRange } from "../leaveGuard.js";

describe("leaveGuard.assertNoLeaveOverlapRange", () => {
  test("lanza error si hay traslape", async () => {
    const SolicitudPermisosLicencias = { findOne: jest.fn().mockResolvedValue({ id_solicitud: 7 }) };

    await expect(
      assertNoLeaveOverlapRange({
        models: { SolicitudPermisosLicencias },
        idColaborador: 10,
        fecha_inicio: new Date("2026-01-20T08:00:00.000Z"),
        fecha_fin: new Date("2026-01-20T10:00:00.000Z"),
        blockingStatusIds: [1, 2],
        transaction: null,
      })
    ).rejects.toThrow(/BLOQUEADO_POR_TRASLAPE_PERMISO/);
  });

  test("no lanza si no hay traslape", async () => {
    const SolicitudPermisosLicencias = { findOne: jest.fn().mockResolvedValue(null) };

    await expect(
      assertNoLeaveOverlapRange({
        models: { SolicitudPermisosLicencias },
        idColaborador: 10,
        fecha_inicio: new Date("2026-01-20T08:00:00.000Z"),
        fecha_fin: new Date("2026-01-20T10:00:00.000Z"),
        blockingStatusIds: [1, 2],
        transaction: null,
      })
    ).resolves.toBeUndefined();
  });
});
