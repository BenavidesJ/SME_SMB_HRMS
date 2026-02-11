import { jest, describe, it, expect, afterEach } from "@jest/globals";

// Mocks must be set up BEFORE dynamic import
const mockPlanillaFindAll = jest.fn();
const mockSaldoVacacionesFindOne = jest.fn();

jest.unstable_mockModule("../../../models/index.js", () => ({
  Planilla: { findAll: mockPlanillaFindAll },
  PeriodoPlanilla: { name: "periodo_planilla" },
  SaldoVacaciones: { findOne: mockSaldoVacacionesFindOne },
  Colaborador: { name: "colaborador" },
  Contrato: { name: "contrato" },
}));

// Dynamic import AFTER mocks are established
const {
  calcularSalarioDiario,
  obtenerDiasLaborados,
  calcularAntiguedad,
  calcularCesantia,
  calcularPreaviso,
  calcularSalarioPendiente,
  validarDatosLiquidacion,
  obtenerSalariosPorMes,
  calcularAguinaldoProporcional,
  calcularVacacionesProporcionales,
  obtenerPromedioBases,
} = await import("../utils/liquidacionCalculator.js");

describe("liquidacionCalculator", () => {
  afterEach(() => jest.clearAllMocks());

  describe("calcularSalarioDiario", () => {
    it("calcula salario diario = salario mensual / 30", () => {
      const resultado = calcularSalarioDiario(600000, "mensual");
      expect(resultado).toBe(20000);
    });

    it("calcula salario diario de salario quincenal", () => {
      const resultado = calcularSalarioDiario(300000, "quincenal");
      expect(resultado).toBe(20000);
    });

    it("usa mensual por defecto", () => {
      const resultado = calcularSalarioDiario(600000);
      expect(resultado).toBe(20000);
    });

    it("redondea a 2 decimales", () => {
      const resultado = calcularSalarioDiario(650000, "mensual");
      // 650000 / 30 = 21666.666... → 21666.67
      expect(resultado).toBeCloseTo(21666.67, 2);
    });
  });

  describe("obtenerDiasLaborados", () => {
    it("calcula días laborales correctamente", () => {
      // Del 1 al 10 de enero 2025 (10 días)
      // Sábado 4, Domingo 5
      const resultado = obtenerDiasLaborados("2025-01-01", "2025-01-10");
      expect(resultado.diasTotales).toBe(10);
      expect(resultado.diasFinesDesemana).toBe(2);
      expect(resultado.diasLaborados).toBe(8);
    });

    it("maneja período de un día", () => {
      const resultado = obtenerDiasLaborados("2025-01-01", "2025-01-01");
      expect(resultado.diasTotales).toBe(1);
    });

    it("exluye sábados y domingos", () => {
      // Del 1 al 8 enero 2025
      // Sábado 4, Domingo 5
      const resultado = obtenerDiasLaborados("2025-01-01", "2025-01-08");
      expect(resultado.diasFinesDesemana).toBe(2);
      expect(resultado.diasLaborados).toBe(6);
    });
  });

  describe("calcularAntiguedad", () => {
    it("calcula antigüedad correctamente", () => {
      const resultado = calcularAntiguedad("2020-01-01", "2025-01-01");
      expect(resultado.anios).toBe(5);
      expect(resultado.diasTotales).toBeGreaterThan(1825); // ~1826 días
    });

    it("maneja períodos menores a un año", () => {
      const resultado = calcularAntiguedad("2025-01-01", "2025-06-01");
      expect(resultado.anios).toBe(0);
      expect(resultado.meses).toBeGreaterThan(4);
    });

    it("calcula días correctamente", () => {
      const resultado = calcularAntiguedad("2025-01-01", "2025-01-31");
      expect(resultado.diasTotales).toBe(30);
    });
  });

  describe("calcularCesantia", () => {
    it("retorna 0 para renuncia", () => {
      const resultado = calcularCesantia(365 * 2, 20000, "Renuncia");
      expect(resultado.diasCesantia).toBe(0);
      expect(resultado.montoCesantia).toBe(0);
    });

    it("retorna 0 para despido sin responsabilidad", () => {
      const resultado = calcularCesantia(365 * 2, 20000, "Despido sin responsabilidad");
      expect(resultado.diasCesantia).toBe(0);
      expect(resultado.montoCesantia).toBe(0);
    });

    it("retorna 0 para antigüedad < 3 meses (despido con responsabilidad)", () => {
      const resultado = calcularCesantia(60, 20000, "Despido con responsabilidad");
      expect(resultado.diasCesantia).toBe(0);
      expect(resultado.montoCesantia).toBe(0);
    });

    it("retorna 7 días para 3-6 meses de antigüedad", () => {
      const resultado = calcularCesantia(130, 20000, "Despido con responsabilidad");
      expect(resultado.diasCesantia).toBe(7);
      expect(resultado.montoCesantia).toBe(140000);
    });

    it("retorna 14 días para 6 meses - 1 año", () => {
      const resultado = calcularCesantia(230, 20000, "Despido con responsabilidad");
      expect(resultado.diasCesantia).toBe(14);
      expect(resultado.montoCesantia).toBe(280000);
    });

    it("retorna 20 días para 1-2 años", () => {
      const resultado = calcularCesantia(365, 20000, "Despido con responsabilidad");
      expect(resultado.diasCesantia).toBe(20);
      expect(resultado.montoCesantia).toBe(400000);
    });

    it("retorna 30 días para 2+ años", () => {
      const resultado = calcularCesantia(730, 20000, "Despido con responsabilidad");
      expect(resultado.diasCesantia).toBe(30);
      expect(resultado.montoCesantia).toBe(600000);
    });

    it("aplica máximo de 160 días para antigüedad > 6 años", () => {
      const resultado = calcularCesantia(365 * 7, 20000, "Despido con responsabilidad");
      expect(resultado.diasCesantia).toBeLessThanOrEqual(160);
    });

    it("redondea el monto correctamente", () => {
      const resultado = calcularCesantia(365, 20000.50, "Despido con responsabilidad");
      expect(resultado.montoCesantia).toBeCloseTo(400010, 0);
    });
  });

  describe("calcularPreaviso", () => {
    it("retorna 0 si se realizó preaviso", () => {
      const resultado = calcularPreaviso(365, 20000, true, "Despido con responsabilidad");
      expect(resultado.diasPreaviso).toBe(0);
      expect(resultado.montoPreaviso).toBe(0);
    });

    it("retorna 0 para renuncia", () => {
      const resultado = calcularPreaviso(365, 20000, false, "Renuncia");
      expect(resultado.diasPreaviso).toBe(0);
      expect(resultado.montoPreaviso).toBe(0);
    });

    it("retorna 7 días para < 6 meses sin preaviso", () => {
      const resultado = calcularPreaviso(120, 20000, false, "Despido con responsabilidad");
      expect(resultado.diasPreaviso).toBe(7);
      expect(resultado.montoPreaviso).toBe(140000);
    });

    it("retorna 15 días para 6 meses - 1 año sin preaviso", () => {
      const resultado = calcularPreaviso(250, 20000, false, "Despido con responsabilidad");
      expect(resultado.diasPreaviso).toBe(15);
      expect(resultado.montoPreaviso).toBe(300000);
    });

    it("retorna 30 días para 1+ año sin preaviso", () => {
      const resultado = calcularPreaviso(400, 20000, false, "Despido con responsabilidad");
      expect(resultado.diasPreaviso).toBe(30);
      expect(resultado.montoPreaviso).toBe(600000);
    });
  });

  describe("calcularSalarioPendiente", () => {
    it("calcula salarios pendientes correctamente", () => {
      const resultado = calcularSalarioPendiente(10, 20000);
      expect(resultado.diasPendientes).toBe(10);
      expect(resultado.montoSalarioPendiente).toBe(200000);
    });

    it("retorna 0 si no hay días pendientes", () => {
      const resultado = calcularSalarioPendiente(0, 20000);
      expect(resultado.diasPendientes).toBe(0);
      expect(resultado.montoSalarioPendiente).toBe(0);
    });

    it("redondea correctamente", () => {
      const resultado = calcularSalarioPendiente(10, 20000.50);
      expect(resultado.montoSalarioPendiente).toBeCloseTo(200005, 0);
    });
  });

  describe("validarDatosLiquidacion", () => {
    it("retorna válido para datos correctos", () => {
      const datos = {
        idColaborador: 1,
        causa: "Renuncia",
        fechaTerminacion: "2025-01-31",
        fechaInicio: "2020-01-01",
        salarioDiario: 20000,
      };

      const resultado = validarDatosLiquidacion(datos);
      expect(resultado.esValido).toBe(true);
      expect(resultado.errores).toHaveLength(0);
    });

    it("retorna errores si falta idColaborador", () => {
      const datos = {
        causa: "Renuncia",
        fechaTerminacion: "2025-01-31",
      };

      const resultado = validarDatosLiquidacion(datos);
      expect(resultado.esValido).toBe(false);
      expect(resultado.errores.length).toBeGreaterThan(0);
    });

    it("detecta fecha de terminación anterior a inicio", () => {
      const datos = {
        idColaborador: 1,
        causa: "Renuncia",
        fechaTerminacion: "2020-01-01",
        fechaInicio: "2025-01-31",
      };

      const resultado = validarDatosLiquidacion(datos);
      expect(resultado.esValido).toBe(false);
      expect(
        resultado.errores.some((e) => e.includes("anterior"))
      ).toBe(true);
    });

    it("rechaza salario negativo", () => {
      const datos = {
        idColaborador: 1,
        causa: "Renuncia",
        fechaTerminacion: "2025-01-31",
        fechaInicio: "2020-01-01",
        salarioDiario: -100,
      };

      const resultado = validarDatosLiquidacion(datos);
      expect(resultado.esValido).toBe(false);
      expect(
        resultado.errores.some((e) => e.includes("negativo"))
      ).toBe(true);
    });

    it("advierte si salario es 0", () => {
      const datos = {
        idColaborador: 1,
        causa: "Renuncia",
        fechaTerminacion: "2025-01-31",
        fechaInicio: "2020-01-01",
        salarioDiario: 0,
      };

      const resultado = validarDatosLiquidacion(datos);
      expect(resultado.advertencias.length).toBeGreaterThan(0);
    });
  });

  describe("obtenerSalariosPorMes", () => {
    it("agrupa salarios por mes correctamente", async () => {
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 12, anio: 2024, total: "500000.00" },
        { mes: 1, anio: 2025, total: "550000.00" },
      ]);

      const resultado = await obtenerSalariosPorMes(1, "2024-12-01", "2025-01-31");

      expect(resultado).toHaveLength(2);
      expect(resultado[0]).toEqual({ mes: 12, anio: 2024, total: 500000 });
      expect(resultado[1]).toEqual({ mes: 1, anio: 2025, total: 550000 });
    });

    it("retorna array vacío si no hay planillas", async () => {
      mockPlanillaFindAll.mockResolvedValue([]);

      const resultado = await obtenerSalariosPorMes(99, "2024-12-01", "2025-01-31");
      expect(resultado).toEqual([]);
    });
  });

  describe("calcularAguinaldoProporcional", () => {
    it("retorna 0 para despido sin responsabilidad", async () => {
      const resultado = await calcularAguinaldoProporcional(
        1,
        "2025-01-31",
        "Despido sin responsabilidad"
      );

      expect(resultado.montoAguinaldo).toBe(0);
      expect(resultado.detalles.razon).toContain("No aplica");
    });

    it("calcula aguinaldo para renuncia", async () => {
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 12, anio: 2024, total: "600000.00" },
        { mes: 1, anio: 2025, total: "600000.00" },
      ]);

      const resultado = await calcularAguinaldoProporcional(
        1,
        "2025-01-31",
        "Renuncia"
      );

      expect(resultado.montoAguinaldo).toBe(100000); // 1200000 / 12
      expect(resultado.periodo.desde).toBe("2024-12-01");
    });

    it("calcula aguinaldo para despido con responsabilidad", async () => {
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 12, anio: 2024, total: "600000.00" },
        { mes: 1, anio: 2025, total: "600000.00" },
      ]);

      const resultado = await calcularAguinaldoProporcional(
        1,
        "2025-01-31",
        "Despido con responsabilidad"
      );

      expect(resultado.montoAguinaldo).toBe(100000);
    });
  });

  describe("calcularVacacionesProporcionales", () => {
    it("retorna 0 si no hay registro de vacaciones", async () => {
      mockPlanillaFindAll.mockResolvedValue([]);
      mockSaldoVacacionesFindOne.mockResolvedValue(null);

      const resultado = await calcularVacacionesProporcionales(99);

      expect(resultado.diasVacacionesPendientes).toBe(0);
      expect(resultado.montoVacaciones).toBe(0);
    });

    it("calcula vacaciones pendientes correctamente", async () => {
      mockSaldoVacacionesFindOne.mockResolvedValue({
        dias_ganados: 20,
        dias_tomados: 10,
      });

      mockPlanillaFindAll.mockResolvedValue([
        { mes: 10, anio: 2024, total: "600000.00" },
        { mes: 11, anio: 2024, total: "600000.00" },
        { mes: 12, anio: 2024, total: "600000.00" },
      ]);

      const resultado = await calcularVacacionesProporcionales(1);

      expect(resultado.diasVacacionesPendientes).toBe(10);
      expect(resultado.montoVacaciones).toBeGreaterThan(0);
    });
  });

  describe("obtenerPromedioBases", () => {
    it("calcula promedio de últimos 3 meses por defecto", async () => {
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 10, anio: 2024, total: "600000.00" },
        { mes: 11, anio: 2024, total: "600000.00" },
        { mes: 12, anio: 2024, total: "600000.00" },
      ]);

      const resultado = await obtenerPromedioBases(1);

      expect(resultado.promedioMensual).toBe(600000);
      expect(resultado.promedioDiario).toBe(20000);
    });

    it("calcula promedio con número customizado de meses", async () => {
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 1, anio: 2025, total: "600000.00" },
        { mes: 2, anio: 2025, total: "600000.00" },
      ]);

      const resultado = await obtenerPromedioBases(1, 2);

      expect(resultado.detalles).toHaveLength(2);
    });
  });

  /**
   * Caso real: Colaborador con salario ₡2,892,000
   * Ingreso: 16 enero 2025
   * Salida: 31 diciembre 2025 (Despido con responsabilidad)
   * Antigüedad: ~350 días (> 6 meses, < 1 año)
   * Cesantía: 14 días = ₡1,349,600
   * Aguinaldo proporcional: 1 mes (solo diciembre) = ₡241,000
   * Total esperado: ₡1,590,600
   */
  describe("Escenario real: Liquidación colaborador ₡2,892,000", () => {
    const SALARIO_MENSUAL = 2892000;
    const SALARIO_DIARIO = SALARIO_MENSUAL / 30; // 96,400
    const FECHA_INGRESO = "2025-01-16";
    const FECHA_SALIDA = "2025-12-31";
    const CAUSA = "Despido con responsabilidad";

    it("calcula antigüedad correcta (~350 días, < 1 año)", () => {
      const resultado = calcularAntiguedad(FECHA_INGRESO, FECHA_SALIDA);

      expect(resultado.anios).toBe(0);
      expect(resultado.meses).toBeGreaterThanOrEqual(11);
      // 349 días (16 ene - 31 dic, exclusivo del día inicio)
      expect(resultado.diasTotales).toBe(349);
    });

    it("calcula salario diario = ₡96,400", () => {
      const resultado = calcularSalarioDiario(SALARIO_MENSUAL, "mensual");
      expect(resultado).toBeCloseTo(96400, 2);
    });

    it("calcula cesantía = 14 días (₡1,349,600) para 6m-1año de antigüedad", () => {
      const { diasTotales } = calcularAntiguedad(FECHA_INGRESO, FECHA_SALIDA);
      const resultado = calcularCesantia(diasTotales, SALARIO_DIARIO, CAUSA);

      expect(resultado.diasCesantia).toBe(14);
      expect(resultado.montoCesantia).toBeCloseTo(1349600, 0);
    });

    it("calcula aguinaldo proporcional = 1 mes (₡241,000) para salida en diciembre", async () => {
      // En diciembre, el período de aguinaldo vigente es dic 2025 - nov 2026
      // Solo se calcula 1 mes proporcional (diciembre)
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 12, anio: 2025, total: String(SALARIO_MENSUAL) },
      ]);

      const resultado = await calcularAguinaldoProporcional(1, FECHA_SALIDA, CAUSA);

      expect(resultado.detalles.mesesIncluidos).toBe(1);
      expect(resultado.montoAguinaldo).toBeCloseTo(241000, 0);
    });

    it("calcula total liquidación ≈ ₡1,590,600 (cesantía + aguinaldo)", async () => {
      const { diasTotales } = calcularAntiguedad(FECHA_INGRESO, FECHA_SALIDA);

      // Cesantía
      const cesantia = calcularCesantia(diasTotales, SALARIO_DIARIO, CAUSA);

      // Aguinaldo (1 mes proporcional)
      mockPlanillaFindAll.mockResolvedValue([
        { mes: 12, anio: 2025, total: String(SALARIO_MENSUAL) },
      ]);
      const aguinaldo = await calcularAguinaldoProporcional(1, FECHA_SALIDA, CAUSA);

      // Total (sin vacaciones ni preaviso en este caso)
      const totalLiquidacion = cesantia.montoCesantia + aguinaldo.montoAguinaldo;

      expect(totalLiquidacion).toBeCloseTo(1590600, 0);
    });
  });
});
