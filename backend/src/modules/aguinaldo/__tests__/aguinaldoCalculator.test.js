import { jest, describe, it, expect, afterEach } from "@jest/globals";

// Mocks must be set up BEFORE dynamic import
const mockPlanillaFindAll = jest.fn();
const mockAguinaldoFindOne = jest.fn();

jest.unstable_mockModule("../../../models/index.js", () => ({
  Planilla: { findAll: mockPlanillaFindAll },
  PeriodoPlanilla: { name: "periodo_planilla" },
  Aguinaldo: { findOne: mockAguinaldoFindOne },
}));

// Dynamic import AFTER mocks are established
const {
  obtenerSalariosPorMes,
  calcularMontoPorColaborador,
  buscarAguinaldoExistente,
  calcularPeriodoDefault,
} = await import("../utils/aguinaldoCalculator.js");

describe("aguinaldoCalculator", () => {
  afterEach(() => jest.clearAllMocks());

  describe("calcularPeriodoDefault", () => {
    it("devuelve Dic anterior - Nov actual para 2026", () => {
      const { periodoDesde, periodoHasta } = calcularPeriodoDefault(2026);
      expect(periodoDesde).toBe("2025-12-01");
      expect(periodoHasta).toBe("2026-11-30");
    });

    it("funciona para otros anios", () => {
      const { periodoDesde, periodoHasta } = calcularPeriodoDefault(2024);
      expect(periodoDesde).toBe("2023-12-01");
      expect(periodoHasta).toBe("2024-11-30");
    });

    it("maneja anio 2020", () => {
      const { periodoDesde, periodoHasta } = calcularPeriodoDefault(2020);
      expect(periodoDesde).toBe("2019-12-01");
      expect(periodoHasta).toBe("2020-11-30");
    });
  });

  describe("obtenerSalariosPorMes", () => {
    it("agrupa resultados correctamente", async () => {
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 12, anio: 2024, total: "500000.00" },
        { mes: 1, anio: 2025, total: "550000.00" },
        { mes: 2, anio: 2025, total: "550000.00" },
      ]);

      const result = await obtenerSalariosPorMes(1, "2024-12-01", "2025-11-30");

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ mes: 12, anio: 2024, total: 500000 });
      expect(result[1]).toEqual({ mes: 1, anio: 2025, total: 550000 });
      expect(result[2]).toEqual({ mes: 2, anio: 2025, total: 550000 });
      expect(mockPlanillaFindAll).toHaveBeenCalledTimes(1);
    });

    it("retorna array vacio si no hay planillas", async () => {
      mockPlanillaFindAll.mockResolvedValue([]);
      const result = await obtenerSalariosPorMes(99, "2024-12-01", "2025-11-30");
      expect(result).toEqual([]);
    });

    it("convierte strings a numeros", async () => {
      mockPlanillaFindAll.mockResolvedValue([
        { mes: "3", anio: "2025", total: "750000.50" },
      ]);

      const result = await obtenerSalariosPorMes(1, "2025-01-01", "2025-11-30");
      expect(result[0].mes).toBe(3);
      expect(result[0].anio).toBe(2025);
      expect(result[0].total).toBe(750000.5);
    });
  });

  describe("calcularMontoPorColaborador", () => {
    it("calcula aguinaldo = totalBruto / 12 para anio completo", async () => {
      const meses = [{ mes: 12, anio: 2024, total: "600000.00" }];
      for (let m = 1; m <= 11; m++) {
        meses.push({ mes: m, anio: 2025, total: "600000.00" });
      }
      mockPlanillaFindAll.mockResolvedValue(meses);

      const result = await calcularMontoPorColaborador(1, "2024-12-01", "2025-11-30");

      expect(result.totalBruto).toBe(7200000);
      expect(result.montoAguinaldo).toBe(600000);
      expect(result.desglose).toHaveLength(12);
    });

    it("calcula proporcional si solo tiene 6 meses de datos", async () => {
      const meses = [];
      for (let m = 1; m <= 6; m++) {
        meses.push({ mes: m, anio: 2025, total: "500000.00" });
      }
      mockPlanillaFindAll.mockResolvedValue(meses);

      const result = await calcularMontoPorColaborador(1, "2024-12-01", "2025-11-30");

      expect(result.totalBruto).toBe(3000000);
      expect(result.montoAguinaldo).toBe(250000);
      expect(result.desglose).toHaveLength(6);
    });

    it("retorna 0 si no hay planillas registradas", async () => {
      mockPlanillaFindAll.mockResolvedValue([]);

      const result = await calcularMontoPorColaborador(99, "2024-12-01", "2025-11-30");

      expect(result.totalBruto).toBe(0);
      expect(result.montoAguinaldo).toBe(0);
      expect(result.desglose).toEqual([]);
    });

    it("maneja correctamente salarios variables por mes", async () => {
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 12, anio: 2024, total: "650000.00" },
        { mes: 1, anio: 2025, total: "600000.00" },
        { mes: 2, anio: 2025, total: "700000.50" },
        { mes: 3, anio: 2025, total: "600000.00" },
        { mes: 4, anio: 2025, total: "600000.00" },
        { mes: 5, anio: 2025, total: "600000.00" },
        { mes: 6, anio: 2025, total: "610000.00" },
        { mes: 7, anio: 2025, total: "600000.00" },
        { mes: 8, anio: 2025, total: "600000.00" },
        { mes: 9, anio: 2025, total: "600000.00" },
        { mes: 10, anio: 2025, total: "600000.00" },
        { mes: 11, anio: 2025, total: "650000.00" },
      ]);

      const result = await calcularMontoPorColaborador(1, "2024-12-01", "2025-11-30");
      const expectedTotal = 650000 + 600000 + 700000.50 + 600000 + 600000 + 600000 + 610000 + 600000 + 600000 + 600000 + 600000 + 650000;
      const expectedAguinaldo = Math.round((expectedTotal / 12) * 100) / 100;

      expect(result.totalBruto).toBe(expectedTotal);
      expect(result.montoAguinaldo).toBe(expectedAguinaldo);
    });

    it("redondea a 2 decimales", async () => {
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 1, anio: 2025, total: "100000.00" },
        { mes: 2, anio: 2025, total: "100000.00" },
        { mes: 3, anio: 2025, total: "100000.00" },
        { mes: 4, anio: 2025, total: "100000.00" },
        { mes: 5, anio: 2025, total: "100000.00" },
        { mes: 6, anio: 2025, total: "100000.00" },
        { mes: 7, anio: 2025, total: "100001.00" },
      ]);

      const result = await calcularMontoPorColaborador(1, "2025-01-01", "2025-11-30");
      expect(result.montoAguinaldo).toBe(58333.42);
    });
  });

  describe("buscarAguinaldoExistente", () => {
    it("retorna null si no existe registro", async () => {
      mockAguinaldoFindOne.mockResolvedValue(null);

      const result = await buscarAguinaldoExistente(1, 2025);
      expect(result).toBeNull();
      expect(mockAguinaldoFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id_colaborador: 1, anio: 2025 },
        }),
      );
    });

    it("retorna el registro existente si ya existe", async () => {
      const mockRegistro = {
        id_aguinaldo: 5,
        id_colaborador: 1,
        anio: 2025,
        monto_calculado: 600000,
      };
      mockAguinaldoFindOne.mockResolvedValue(mockRegistro);

      const result = await buscarAguinaldoExistente(1, 2025);
      expect(result).toEqual(mockRegistro);
    });
  });
});
