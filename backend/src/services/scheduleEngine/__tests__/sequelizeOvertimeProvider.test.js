import { jest } from "@jest/globals";
import { loadApprovedOvertimeHoursForDate } from "../sequelizeOvertimeProvider.js";

describe("sequelizeOvertimeProvider (mocked)", () => {
  test("suma horas_aprobadas, y si es null usa horas_solicitadas", async () => {
    const Estado = {
      findOne: jest.fn().mockResolvedValue({ id_estado: 9, estado: "APROBADO" }),
    };

    const SolicitudHoraExtra = {
      findAll: jest.fn().mockResolvedValue([
        { horas_aprobadas: "2.00", horas_solicitadas: "3.00" },
        { horas_aprobadas: null, horas_solicitadas: "1.50" },
      ]),
    };

    const total = await loadApprovedOvertimeHoursForDate({
      models: { SolicitudHoraExtra, Estado },
      idColaborador: 10,
      dateStr: "2026-02-26",
    });

    expect(Estado.findOne).toHaveBeenCalled();
    expect(SolicitudHoraExtra.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id_colaborador: 10,
          fecha_trabajo: "2026-02-26",
          estado: 9,
        }),
      })
    );

    expect(total).toBe(3.5);
  });

  test("si no hay solicitudes => 0", async () => {
    const Estado = {
      findOne: jest.fn().mockResolvedValue({ id_estado: 9, estado: "APROBADO" }),
    };

    const SolicitudHoraExtra = {
      findAll: jest.fn().mockResolvedValue([]),
    };

    const total = await loadApprovedOvertimeHoursForDate({
      models: { SolicitudHoraExtra, Estado },
      idColaborador: 10,
      dateStr: "2026-02-26",
    });

    expect(total).toBe(0);
  });
});
