import { jest } from "@jest/globals";
import { Op } from "sequelize";

const Contrato = { findAll: jest.fn() };
const PeriodoPlanilla = { findByPk: jest.fn() };
const ensureEstado = jest.fn();

jest.unstable_mockModule("../../../../../models/index.js", () => ({
  models: { Contrato, PeriodoPlanilla },
}));

jest.unstable_mockModule("../../../shared/resolvers.js", () => ({
  ensureEstado,
}));

const {
  listarColaboradoresElegiblesPeriodo,
} = await import("../eligibleCollaborators.js");

describe("listarColaboradoresElegiblesPeriodo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("usa solo contratos iniciados antes del inicio del periodo", async () => {
    PeriodoPlanilla.findByPk.mockResolvedValue({
      id_periodo: 55,
      fecha_inicio: "2026-04-01",
      fecha_fin: "2026-04-15",
      estado: 1,
    });

    ensureEstado.mockResolvedValue({ id_estado: 10 });
    Contrato.findAll.mockResolvedValue([]);

    const result = await listarColaboradoresElegiblesPeriodo({ periodoId: 55 });

    const query = Contrato.findAll.mock.calls[0][0];
    expect(query.where.estado).toBe(10);
    expect(query.where.fecha_inicio[Op.lt]).toBe("2026-04-01");
    expect(query.where.fecha_inicio[Op.lte]).toBeUndefined();

    expect(result.total_elegibles).toBe(0);
    expect(result.total_generados).toBe(0);
    expect(result.total_pendientes).toBe(0);
  });

  test("deduplica por colaborador y calcula totales de planilla generada", async () => {
    PeriodoPlanilla.findByPk.mockResolvedValue({
      id_periodo: 55,
      fecha_inicio: "2026-04-01",
      fecha_fin: "2026-04-15",
      estado: 1,
    });

    ensureEstado.mockResolvedValue({ id_estado: 10 });
    Contrato.findAll.mockResolvedValue([
      {
        id_contrato: 31,
        id_colaborador: 1,
        fecha_inicio: "2026-03-31",
        colaborador: {
          id_colaborador: 1,
          nombre: "Ana",
          primer_apellido: "Mora",
          segundo_apellido: "Rojas",
          identificacion: "111",
        },
        planillas: [{ id_detalle: 900, id_periodo: 55 }],
      },
      {
        id_contrato: 30,
        id_colaborador: 1,
        fecha_inicio: "2026-03-01",
        colaborador: {
          id_colaborador: 1,
          nombre: "Ana",
          primer_apellido: "Mora",
          segundo_apellido: "Rojas",
          identificacion: "111",
        },
        planillas: [],
      },
      {
        id_contrato: 41,
        id_colaborador: 2,
        fecha_inicio: "2026-03-10",
        colaborador: {
          id_colaborador: 2,
          nombre: "Luis",
          primer_apellido: "Vega",
          segundo_apellido: "Castro",
          identificacion: "222",
        },
        planillas: [],
      },
    ]);

    const result = await listarColaboradoresElegiblesPeriodo({ periodoId: 55 });

    expect(result.colaboradores).toHaveLength(2);
    expect(result.colaboradores[0]).toMatchObject({
      id_colaborador: 1,
      id_contrato: 31,
      nombre_completo: "Ana Mora Rojas",
      tiene_planilla: true,
    });
    expect(result.colaboradores[1]).toMatchObject({
      id_colaborador: 2,
      id_contrato: 41,
      nombre_completo: "Luis Vega Castro",
      tiene_planilla: false,
    });

    expect(result.total_elegibles).toBe(2);
    expect(result.total_generados).toBe(1);
    expect(result.total_pendientes).toBe(1);
  });
});
