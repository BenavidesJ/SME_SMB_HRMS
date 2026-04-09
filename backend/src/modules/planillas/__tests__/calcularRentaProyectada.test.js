import {
  calcularHorasOrdinariasPagadasFeriadoObligatorio,
  calcularRecargoFeriadoObligatorio,
  calcularRentaProyectada,
  normalizarFechaFinMesComercial,
} from "../shared/calculations.js";

describe("calcularRentaProyectada con créditos fiscales", () => {
  test("si el salario está exento, la renta final es 0 aunque existan créditos", () => {
    const result = calcularRentaProyectada(400000, {
      estado_civil: "CASADO",
      cantidad_hijos: 2,
    });

    expect(result.proyectado_mensual).toBe(800000);
    expect(result.impuesto_mensual).toBe(0);
    expect(result.impuesto_quincenal_sin_creditos).toBe(0);
    expect(result.creditos_fiscales.total_mensual).toBe(0);
    expect(result.monto_quincenal).toBe(0);
  });

  test("si es soltero con hijos, mantiene el cálculo base sin créditos", () => {
    const result = calcularRentaProyectada(1000000, {
      estado_civil: "SOLTERO",
      cantidad_hijos: 2,
    });

    expect(result.proyectado_mensual).toBe(2000000);
    expect(result.impuesto_mensual).toBe(140850);
    expect(result.impuesto_quincenal_sin_creditos).toBe(70425);
    expect(result.creditos_fiscales.por_conyuge_mensual).toBe(0);
    expect(result.creditos_fiscales.por_hijos_mensual).toBe(0);
    expect(result.creditos_fiscales.total_mensual).toBe(0);
    expect(result.creditos_fiscales.cantidad_hijos_aplicada).toBe(0);
    expect(result.monto_quincenal).toBe(70425);
  });

  test("si es casado sin hijos, aplica solo el crédito por cónyuge", () => {
    const result = calcularRentaProyectada(1000000, {
      estado_civil: "CASADO",
      cantidad_hijos: 0,
    });

    expect(result.impuesto_mensual).toBe(140850);
    expect(result.impuesto_quincenal_sin_creditos).toBe(70425);
    expect(result.creditos_fiscales.por_conyuge_mensual).toBe(2590);
    expect(result.creditos_fiscales.por_hijos_mensual).toBe(0);
    expect(result.creditos_fiscales.total_mensual).toBe(2590);
    expect(result.impuesto_mensual_con_creditos).toBe(138260);
    expect(result.monto_quincenal).toBe(69130);
  });

  test("si es casado con hijos, aplica ambos créditos y reduce la renta final", () => {
    const result = calcularRentaProyectada(1000000, {
      estado_civil: "casado",
      cantidad_hijos: 2,
    });

    expect(result.impuesto_mensual).toBe(140850);
    expect(result.creditos_fiscales.por_conyuge_mensual).toBe(2590);
    expect(result.creditos_fiscales.por_hijos_mensual).toBe(3420);
    expect(result.creditos_fiscales.total_mensual).toBe(6010);
    expect(result.impuesto_mensual_con_creditos).toBe(134840);
    expect(result.monto_quincenal).toBe(67420);
  });

  test("nunca retorna renta negativa cuando los créditos superan el impuesto", () => {
    const result = calcularRentaProyectada(500000, {
      estado_civil: "CASADO",
      cantidad_hijos: 10,
    });

    expect(result.impuesto_mensual).toBe(8200);
    expect(result.creditos_fiscales.total_mensual).toBe(19690);
    expect(result.impuesto_mensual_con_creditos).toBe(0);
    expect(result.monto_quincenal).toBe(0);
  });
});

describe("normalizarFechaFinMesComercial", () => {
  test("ajusta día 31 al día 30 del mismo mes", () => {
    expect(normalizarFechaFinMesComercial("2026-01-31")).toBe("2026-01-30");
  });

  test("no cambia fechas distintas del día 31", () => {
    expect(normalizarFechaFinMesComercial("2026-01-30")).toBe("2026-01-30");
  });

  test("si la fecha es inválida, retorna el valor original", () => {
    expect(normalizarFechaFinMesComercial("fecha-invalida")).toBe("fecha-invalida");
  });
});

describe("feriados obligatorios en salario base fijo", () => {
  test("feriado obligatorio no trabajado paga la jornada ordinaria completa", () => {
    expect(calcularHorasOrdinariasPagadasFeriadoObligatorio(8)).toBe(8);
    expect(calcularHorasOrdinariasPagadasFeriadoObligatorio("8")).toBe(8);
  });

  test("si horas programadas no son válidas, no suma horas ordinarias por feriado", () => {
    expect(calcularHorasOrdinariasPagadasFeriadoObligatorio(0)).toBe(0);
    expect(calcularHorasOrdinariasPagadasFeriadoObligatorio(-1)).toBe(0);
    expect(calcularHorasOrdinariasPagadasFeriadoObligatorio("abc")).toBe(0);
  });

  test("feriado obligatorio trabajado aplica recargo adicional +1x", () => {
    expect(
      calcularRecargoFeriadoObligatorio({ horasTrabajadasFeriado: 8, tarifaHora: 5000 })
    ).toBe(40000);
  });

  test("si horas o tarifa no son válidas, recargo de feriado es 0", () => {
    expect(
      calcularRecargoFeriadoObligatorio({ horasTrabajadasFeriado: 0, tarifaHora: 5000 })
    ).toBe(0);
    expect(
      calcularRecargoFeriadoObligatorio({ horasTrabajadasFeriado: 8, tarifaHora: 0 })
    ).toBe(0);
    expect(
      calcularRecargoFeriadoObligatorio({ horasTrabajadasFeriado: "x", tarifaHora: 5000 })
    ).toBe(0);
  });
});
