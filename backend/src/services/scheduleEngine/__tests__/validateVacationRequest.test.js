import { jest } from "@jest/globals";
import { validateVacationRequest } from "../validateVacationRequest.js";

describe("validateVacationRequest (use case)", () => {
  const models = {
    Contrato: { findOne: jest.fn() },
    HorarioLaboral: { findOne: jest.fn() },
    Feriado: { findAll: jest.fn() },
    SolicitudVacaciones: { findAll: jest.fn() },
    Incapacidad: { findAll: jest.fn() },
  };

  const config = {
    contratoActivoIds: [1],
    horarioActivoIds: [1],
    vacationBlockStatusIds: [2],
    timezone: "America/Costa_Rica",
  };

  beforeEach(() => {
    jest.resetAllMocks();

    models.Contrato.findOne.mockResolvedValue({ id_contrato: 10 });
    models.HorarioLaboral.findOne.mockResolvedValue({
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

    models.Feriado.findAll.mockResolvedValue([]);

    models.SolicitudVacaciones.findAll.mockResolvedValue([]);
    models.Incapacidad.findAll.mockResolvedValue([]);
  });

  test("Permite vacaciones si hay saldo suficiente y no hay conflictos", async () => {
    const res = await validateVacationRequest({
      idColaborador: 99,
      startDate: "2026-01-19",
      endDate: "2026-01-23",  
      models,
      config,
      saldoVacaciones: { dias_ganados: 10, dias_tomados: 2 },
    });

    expect(res.allowed).toBe(true);
    expect(res.chargeableDays).toBe(5);
  });

  test("Bloquea por saldo insuficiente", async () => {
    const res = await validateVacationRequest({
      idColaborador: 99,
      startDate: "2026-01-19",
      endDate: "2026-01-23",
      models,
      config,
      saldoVacaciones: { dias_ganados: 3, dias_tomados: 0 },
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("INSUFFICIENT_BALANCE");
  });

  test("Bloquea por conflicto con vacaciones existentes", async () => {
    models.SolicitudVacaciones.findAll.mockResolvedValue([
      {
        id_solicitud_vacaciones: 1,
        estado_solicitud: 2,
        fecha_inicio: "2026-01-20",
        fecha_fin: "2026-01-21",
      },
    ]);

    const res = await validateVacationRequest({
      idColaborador: 99,
      startDate: "2026-01-19",
      endDate: "2026-01-23",
      models,
      config,
      saldoVacaciones: { dias_ganados: 10, dias_tomados: 0 },
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toBe("DATE_CONFLICT");
  });
});
