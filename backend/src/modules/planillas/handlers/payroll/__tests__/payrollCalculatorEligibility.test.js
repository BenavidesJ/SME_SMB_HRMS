import { jest } from "@jest/globals";
import { Op } from "sequelize";

const models = {
  PeriodoPlanilla: { findByPk: jest.fn() },
  Colaborador: { findByPk: jest.fn() },
  Contrato: { findOne: jest.fn() },
  JornadaDiaria: { findAll: jest.fn() },
  Deduccion: { findAll: jest.fn() },
  Feriado: { findAll: jest.fn() },
  HorarioLaboral: { findOne: jest.fn() },
  SolicitudVacaciones: { findAll: jest.fn() },
  SolicitudPermisos: { findAll: jest.fn() },
};

jest.unstable_mockModule("../../../../../models/index.js", () => ({
  models,
}));

const { calcularPlanillaColaborador } = await import("../payrollCalculator.js");

describe("calcularPlanillaColaborador - regla de elegibilidad por contrato", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("busca contrato activo con fecha_inicio estrictamente menor al inicio del periodo", async () => {
    models.Contrato.findOne.mockResolvedValue(null);

    await expect(
      calcularPlanillaColaborador({
        colaboradorId: 7,
        periodoId: 55,
        fechaInicio: "2026-04-01",
        fechaFin: "2026-04-15",
        feriadosFechas: new Set(),
        deduccionesObligatorias: [],
        estadoActivo: { id_estado: 10 },
      }),
    ).rejects.toThrow("El colaborador no tiene un contrato activo");

    const query = models.Contrato.findOne.mock.calls[0][0];
    expect(query.where.id_colaborador).toBe(7);
    expect(query.where.estado).toBe(10);
    expect(query.where.fecha_inicio[Op.lt]).toBe("2026-04-01");
    expect(query.where.fecha_inicio[Op.lte]).toBeUndefined();
  });
});
