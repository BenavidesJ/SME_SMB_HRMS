import { Op, fn, col, literal } from "sequelize";
import {
  Planilla,
  PeriodoPlanilla,
  Colaborador,
  Contrato,
  SaldoVacaciones,
} from "../../../models/index.js";

/**
 * Calcula el salario diario basado en el salario mensual
 * @param {number} salarioMensual - Salario mensual en colones
 * @param {string} tipoCalculo - 'mensual' para dividir entre 30, o 'quincenal' para dividir entre 15/2
 * @returns {number} Salario diario
 */
export function calcularSalarioDiario(salarioMensual, tipoCalculo = "mensual") {
  if (tipoCalculo === "quincenal") {
    return Math.round((salarioMensual / 15) * 100) / 100;
  }
  return Math.round((salarioMensual / 30) * 100) / 100;
}

/**
 * Obtiene días laborados entre dos fechas, excluyendo fines de semana
 * @param {string} fechaInicio - Formato YYYY-MM-DD
 * @param {string} fechaTerminacion - Formato YYYY-MM-DD
 * @returns {{diasLaborados: number, diasTotales: number, diasFinesDesemana: number}}
 */
export function obtenerDiasLaborados(fechaInicio, fechaTerminacion) {
  const inicio = new Date(fechaInicio);
  const termino = new Date(fechaTerminacion);

  let diasTotales = 0;
  let diasFinesDesemana = 0;
  let diasLaborados = 0;

  for (let d = new Date(inicio); d <= termino; d.setDate(d.getDate() + 1)) {
    diasTotales++;
    const diaSemana = d.getDay();
    // 0 = domingo, 6 = sábado
    if (diaSemana === 0 || diaSemana === 6) {
      diasFinesDesemana++;
    } else {
      diasLaborados++;
    }
  }

  return { diasLaborados, diasTotales, diasFinesDesemana };
}

/**
 * Obtiene la antigüedad del colaborador en días
 * @param {string} fechaInicio - Fecha de inicio del contrato (Formato YYYY-MM-DD)
 * @param {string} fechaTerminacion - Fecha de terminación (Formato YYYY-MM-DD)
 * @returns {{diasTotales: number, meses: number, anios: number}}
 */
export function calcularAntiguedad(fechaInicio, fechaTerminacion) {
  const inicio = new Date(fechaInicio);
  const termino = new Date(fechaTerminacion);
  const diasTotales = Math.floor((termino - inicio) / (1000 * 60 * 60 * 24));

  const meses = Math.floor(diasTotales / 30);
  const anios = Math.floor(diasTotales / 365);

  return { diasTotales, meses, anios };
}

/**
 * Obtiene los salarios brutos de un colaborador en un rango de fechas
 * @param {number} idColaborador
 * @param {string} periodoDesde - YYYY-MM-DD
 * @param {string} periodoHasta - YYYY-MM-DD
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<{mes: number, anio: number, total: number}[]>}
 */
export async function obtenerSalariosPorMes(
  idColaborador,
  periodoDesde,
  periodoHasta,
  transaction
) {
  const rows = await Planilla.findAll({
    attributes: [
      [fn("YEAR", col("periodo.fecha_inicio")), "anio"],
      [fn("MONTH", col("periodo.fecha_inicio")), "mes"],
      [fn("SUM", col("planilla.bruto")), "total"],
    ],
    include: [
      {
        model: PeriodoPlanilla,
        as: "periodo",
        attributes: [],
        where: {
          fecha_inicio: {
            [Op.gte]: periodoDesde,
            [Op.lte]: periodoHasta,
          },
        },
      },
    ],
    where: { id_colaborador: idColaborador },
    group: [
      literal("YEAR(`periodo`.`fecha_inicio`)"),
      literal("MONTH(`periodo`.`fecha_inicio`)"),
    ],
    order: [
      [literal("anio"), "ASC"],
      [literal("mes"), "ASC"],
    ],
    raw: true,
    ...(transaction ? { transaction } : {}),
  });

  return rows.map((r) => ({
    mes: Number(r.mes),
    anio: Number(r.anio),
    total: Number(r.total) || 0,
  }));
}

/**
 * Obtiene el promedio de salarios brutos de los últimos N meses
 * @param {number} idColaborador
 * @param {number} meses - Cantidad de meses a promediar (default: 3)
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<{promedioDiario: number, promedioMensual: number, detalles: {mes: number, anio: number, total: number}[]}>}
 */
export async function obtenerPromedioBases(
  idColaborador,
  meses = 3,
  transaction
) {
  const today = new Date();
  const hasta = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  const desde = new Date(
    today.getFullYear(),
    today.getMonth() - meses + 1,
    1
  )
    .toISOString()
    .split("T")[0];

  const detalles = await obtenerSalariosPorMes(
    idColaborador,
    desde,
    hasta,
    transaction
  );

  const totalBruto = detalles.reduce((sum, d) => sum + d.total, 0);
  const promedioMensual = detalles.length > 0 ? totalBruto / detalles.length : 0;
  const promedioDiario = calcularSalarioDiario(promedioMensual);

  return {
    promedioDiario: Math.round(promedioDiario * 100) / 100,
    promedioMensual: Math.round(promedioMensual * 100) / 100,
    detalles,
  };
}

/**
 * Calcula el aguinaldo proporcional según la causa
 * Renuncia: Incluye aguinaldo desde 1 dic del año anterior hasta fecha de término
 * Despido con responsabilidad: Igual a renuncia
 * Despido sin responsabilidad: $0
 *
 * @param {number} idColaborador
 * @param {string} fechaTerminacion - YYYY-MM-DD
 * @param {string} causa - 'Renuncia', 'Despido con responsabilidad', 'Despido sin responsabilidad'
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<{montoAguinaldo: number, periodo: {desde: string, hasta: string}, detalles: object}>}
 */
export async function calcularAguinaldoProporcional(
  idColaborador,
  fechaTerminacion,
  causa,
  transaction
) {
  // Despido sin responsabilidad no paga aguinaldo
  if (causa === "Despido sin responsabilidad") {
    return {
      montoAguinaldo: 0,
      diasCalculados: 0,
      periodo: { desde: null, hasta: null },
      detalles: { razon: "No aplica para despido sin responsabilidad" },
    };
  }

  const fechaTerm = new Date(fechaTerminacion);
  const anioActual = fechaTerm.getFullYear();
  const periodoDesde = `${anioActual - 1}-12-01`;
  const periodoHasta = fechaTerminacion;

  const desglose = await obtenerSalariosPorMes(
    idColaborador,
    periodoDesde,
    periodoHasta,
    transaction
  );

  const totalBruto = desglose.reduce((acc, row) => acc + row.total, 0);

  // Aguinaldo = Total salarios / 12
  const montoAguinaldo = Math.round((totalBruto / 12) * 100) / 100;

  // Calcular días trabajados en el período para referencia
  const { diasLaborados } = obtenerDiasLaborados(periodoDesde, periodoHasta);

  return {
    montoAguinaldo,
    diasCalculados: diasLaborados,
    periodo: { desde: periodoDesde, hasta: periodoHasta },
    detalles: {
      totalSalariosEnPeriodo: Math.round(totalBruto * 100) / 100,
      formula: "Total salarios / 12",
      mesesIncluidos: desglose.length,
      desglose,
    },
  };
}

/**
 * Calcula las vacaciones proporcionales no disfrutadas
 * Se aplica para todas las causas
 * @param {number} idColaborador
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<{diasVacacionesPendientes: number, montoVacaciones: number, detalles: object}>}
 */
export async function calcularVacacionesProporcionales(
  idColaborador,
  transaction
) {
  const saldoVac = await SaldoVacaciones.findOne(
    {
      where: { id_colaborador: idColaborador },
    },
    transaction ? { transaction } : {}
  );

  if (!saldoVac) {
    return {
      diasVacacionesPendientes: 0,
      montoVacaciones: 0,
      detalles: { razon: "No hay registros de vacaciones" },
    };
  }

  const diasGanados = Number(saldoVac.dias_ganados) || 0;
  const diasTomados = Number(saldoVac.dias_tomados) || 0;
  const diasPendientes = Math.max(0, diasGanados - diasTomados);

  // Obtener promedio de salarios para calcular el valor diario
  const { promedioDiario } = await obtenerPromedioBases(
    idColaborador,
    3,
    transaction
  );

  const montoVacaciones = Math.round(diasPendientes * promedioDiario * 100) / 100;

  return {
    diasVacacionesPendientes: diasPendientes,
    montoVacaciones,
    detalles: {
      diasGanados,
      diasTomados,
      promedioDiario,
      formula: "Días pendientes × Salario diario promedio",
    },
  };
}

/**
 * Calcula la cesantía según antigüedad y causa
 * Solo aplica para Despido con responsabilidad
 * @param {number} diasAntiguedad
 * @param {number} salarioDiario
 * @param {string} causa - 'Renuncia', 'Despido con responsabilidad', 'Despido sin responsabilidad'
 * @returns {{diasCesantia: number, montoCesantia: number, formula: string}}
 */
export function calcularCesantia(diasAntiguedad, salarioDiario, causa) {
  // Solo se paga cesantía si es despido con responsabilidad
  if (causa !== "Despido con responsabilidad") {
    return {
      diasCesantia: 0,
      montoCesantia: 0,
      formula: "No aplica para esta causa",
      detalles: { razon: `No aplica para ${causa}` },
    };
  }

  let diasCesantia = 0;
  const anios = Math.floor(diasAntiguedad / 365);
  const meses = Math.floor((diasAntiguedad % 365) / 30);

  if (diasAntiguedad < 90) {
    // Menos de 3 meses
    diasCesantia = 0;
  } else if (diasAntiguedad < 180) {
    // 3 a menos de 6 meses
    diasCesantia = 7;
  } else if (diasAntiguedad < 365) {
    // 6 meses a menos de 1 año
    diasCesantia = 14;
  } else if (diasAntiguedad < 730) {
    // 1 a menos de 2 años
    diasCesantia = 20;
  } else {
    // 2 años o más
    diasCesantia = 30 + (anios - 2) * 20;
    // Máximo 160 días (30 + 6*20)
    diasCesantia = Math.min(diasCesantia, 160);
  }

  const montoCesantia = Math.round(diasCesantia * salarioDiario * 100) / 100;

  return {
    diasCesantia,
    montoCesantia,
    formula: "Días según antigüedad × Salario diario",
    detalles: {
      anios,
      meses,
      diasTotales: diasAntiguedad,
      regla: `${diasAntiguedad < 90 ? "Menos de 3 meses" : diasAntiguedad < 180 ? "3-6 meses" : diasAntiguedad < 365 ? "6 meses a 1 año" : diasAntiguedad < 730 ? "1-2 años" : "2 años o más"}`,
    },
  };
}

/**
 * Calcula el preaviso debido cuando no se realizó
 * @param {number} diasAntiguedad - Días desde inicio hasta terminación
 * @param {number} salarioDiario
 * @param {boolean} realizoPreaviso - Si se realizó preaviso o no
 * @param {string} causa - 'Renuncia', 'Despido con responsabilidad', 'Despido sin responsabilidad'
 * @returns {{diasPreaviso: number, montoPreaviso: number, formula: string}}
 */
export function calcularPreaviso(
  diasAntiguedad,
  salarioDiario,
  realizoPreaviso,
  causa
) {
  // Si ya realizó preaviso, no se paga indemnización
  if (realizoPreaviso) {
    return {
      diasPreaviso: 0,
      montoPreaviso: 0,
      formula: "Preaviso ya fue realizado",
      detalles: { realizoPreaviso: true },
    };
  }

  // Solo aplica para despido con responsabilidad
  if (causa !== "Despido con responsabilidad") {
    return {
      diasPreaviso: 0,
      montoPreaviso: 0,
      formula: `No aplica para ${causa}`,
      detalles: { causa },
    };
  }

  let diasPreaviso = 0;

  if (diasAntiguedad < 180) {
    // Menos de 6 meses
    diasPreaviso = 7;
  } else if (diasAntiguedad < 365) {
    // 6 meses a menos de 1 año
    diasPreaviso = 15;
  } else {
    // 1 año o más
    diasPreaviso = 30;
  }

  const montoPreaviso = Math.round(diasPreaviso * salarioDiario * 100) / 100;

  return {
    diasPreaviso,
    montoPreaviso,
    formula: "Días según antigüedad × Salario diario",
    detalles: {
      diasTotales: diasAntiguedad,
      regla: `${diasAntiguedad < 180 ? "Menos de 6 meses" : diasAntiguedad < 365 ? "6 meses a 1 año" : "1 año o más"}`,
    },
  };
}

/**
 * Calcula salarios pendientes (si aplican)
 * @param {number} diasNoLaboradosPagados - Días del último período que no han sido pagados
 * @param {number} salarioDiario
 * @returns {{diasPendientes: number, montoSalarioPendiente: number}}
 */
export function calcularSalarioPendiente(
  diasNoLaboradosPagados,
  salarioDiario
) {
  const montoSalarioPendiente = Math.round(
    diasNoLaboradosPagados * salarioDiario * 100
  ) / 100;

  return {
    diasPendientes: diasNoLaboradosPagados,
    montoSalarioPendiente,
    formula: "Días pendientes × Salario diario",
  };
}

/**
 * Validación final de datos antes de crear liquidación
 * @param {object} datos - Objeto con todos los datos de la liquidación
 * @returns {{esValido: boolean, errores: string[], advertencias: string[]}}
 */
export function validarDatosLiquidacion(datos) {
  const errores = [];
  const advertencias = [];

  // Validaciones obligatorias
  if (!datos.idColaborador) errores.push("ID del colaborador es requerido");
  if (!datos.causa)
    errores.push('Causa de liquidación es requerida');
  if (!datos.fechaTerminacion)
    errores.push("Fecha de terminación es requerida");
  if (!datos.fechaInicio)
    errores.push("Fecha de inicio de contrato es requerida");

  // Validaciones de fechas
  if (
    datos.fechaTerminacion &&
    datos.fechaInicio &&
    new Date(datos.fechaTerminacion) < new Date(datos.fechaInicio)
  ) {
    errores.push(
      "Fecha de terminación no puede ser anterior a fecha de inicio"
    );
  }

  // Validaciones de montos
  if (datos.salarioDiario !== undefined && datos.salarioDiario < 0) {
    errores.push("Salario diario no puede ser negativo");
  }

  // Advertencias
  if (
    datos.salarioDiario === 0 ||
    (datos.promedioDiario === 0 && !datos.salarioDiario)
  ) {
    advertencias.push("Salario diario es $0, verifique los datos");
  }

  return {
    esValido: errores.length === 0,
    errores,
    advertencias,
  };
}
