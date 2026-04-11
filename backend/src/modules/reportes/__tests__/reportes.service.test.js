import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockPlanillaFindAll = jest.fn();
const mockJornadaDiariaFindAll = jest.fn();

const sequelizeMock = {
  fn: jest.fn((name, value) => ({ name, value })),
  col: jest.fn((value) => ({ value })),
  literal: jest.fn((value) => ({ value })),
  where: jest.fn((left, right) => ({ left, right })),
};

jest.unstable_mockModule("../../../models/index.js", () => ({
  Colaborador: {},
  Contrato: {},
  Departamento: {},
  Estado: {},
  Incapacidad: {},
  JornadaDiaria: { findAll: mockJornadaDiariaFindAll },
  Liquidacion: {},
  PeriodoPlanilla: {},
  Planilla: { findAll: mockPlanillaFindAll },
  Puesto: {},
  SaldoVacaciones: {},
  TipoContrato: {},
  TipoIncapacidad: {},
  TipoJornada: {},
  sequelize: sequelizeMock,
}));

const { getReporteData, parseReportQuery } = await import("../services/reportes.service.js");

describe("reportes.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("ranking_horas_extra usa join de periodo sin proyectar columnas cuando hay filtro de fechas", async () => {
    mockPlanillaFindAll.mockResolvedValue([
      {
        colaborador: { nombre: "Ana", primer_apellido: "Mora", segundo_apellido: "Rojas" },
        contrato: { puesto: { departamento: { nombre: "TI" } } },
        get: (key) => (key === "horas_extra" ? "12" : null),
      },
      {
        colaborador: { nombre: "Luis", primer_apellido: "Vega", segundo_apellido: "Castro" },
        contrato: { puesto: { departamento: { nombre: "RH" } } },
        get: (key) => (key === "horas_extra" ? "8" : null),
      },
    ]);

    const query = parseReportQuery({
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
      limit: "50",
    });

    const result = await getReporteData("ranking_horas_extra", query);

    const findAllArg = mockPlanillaFindAll.mock.calls[0][0];
    const includePeriodo = findAllArg.include.find((include) => include.as === "periodo");

    expect(includePeriodo).toBeDefined();
    expect(includePeriodo.attributes).toEqual([]);
    expect(includePeriodo.required).toBe(true);
    expect(includePeriodo.where).toBeDefined();

    expect(result.rows).toHaveLength(4);
    expect(result.summary).toEqual({
      total_colaboradores_rankeados: 2,
      total_departamentos_rankeados: 2,
    });
    expect(result.rows[0]).toMatchObject({
      tipo: "colaborador",
      nombre: "Ana Mora Rojas",
      horas_extra: 12,
      ranking: 1,
    });
  });

  test("ranking_horas_extra no incluye join de periodo cuando no hay filtro de fechas", async () => {
    mockPlanillaFindAll.mockResolvedValue([]);

    const query = parseReportQuery({});
    await getReporteData("ranking_horas_extra", query);

    const findAllArg = mockPlanillaFindAll.mock.calls[0][0];
    const includePeriodo = findAllArg.include.find((include) => include.as === "periodo");

    expect(includePeriodo).toBeUndefined();
  });

  test("tendencia_incapacidades consulta y mapea el nombre real del tipo", async () => {
    mockJornadaDiariaFindAll.mockResolvedValue([
      {
        fecha: "2026-02-12",
        colaborador: {
          nombre: "Luis",
          primer_apellido: "Vega",
          segundo_apellido: "Castro",
        },
        incapacidadRef: {
          tipo: {
            nombre: "Enfermedad",
          },
        },
      },
    ]);

    const query = parseReportQuery({
      search: "Luis",
      dateFrom: "2026-02-01",
      dateTo: "2026-02-28",
    });

    const result = await getReporteData("tendencia_incapacidades", query);

    const findAllArg = mockJornadaDiariaFindAll.mock.calls[0][0];
    const includeIncapacidad = findAllArg.include.find((include) => include.as === "incapacidadRef");
    const includeTipo = includeIncapacidad.include.find((include) => include.as === "tipo");
    expect(includeTipo.attributes).toEqual(["id_tipo_incap", "nombre"]);
    expect(findAllArg.where).toBeDefined();
    expect(findAllArg.where.fecha).toBeDefined();

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      mes: "2026-02",
      tipo_incapacidad: "Enfermedad",
      colaborador: "Luis Vega Castro",
      dias: 1,
      porcentaje_tipo_mes: 100,
      porcentaje_colaborador_mes: 100,
    });
  });
});
