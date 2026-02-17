import dayjs from "dayjs";
import {
  calcularSalarioDiario,
  calcularAntiguedad,
  calcularAguinaldoProporcional,
  calcularVacacionesProporcionales,
  calcularCesantia,
  calcularPreaviso,
  calcularSalarioPendiente,
  obtenerPromedioBases,
  validarDatosLiquidacion,
} from "../utils/liquidacionCalculator.js";
import { Colaborador, Contrato } from "../../../models/index.js";

/**
 * Simula el cálculo de liquidación sin guardar en BD
 * Retorna desglose completo para que el usuario confirme o ajuste
 * @param {number} idColaborador
 * @param {object} datosEntrada - {causa, fechaTerminacion, realizo_preaviso, salarioDiario (opcional)}
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<object>}
 */
export async function simularLiquidacion(idColaborador, datosEntrada, transaction) {
  // Obtener información del colaborador
  const colaborador = await Colaborador.findByPk(idColaborador, {
    transaction,
  });

  if (!colaborador) {
    const error = new Error("Colaborador no encontrado");
    error.statusCode = 404;
    throw error;
  }

  // Obtener contrato activo del colaborador
  const contrato = await Contrato.findOne(
    {
      where: { id_colaborador: idColaborador },
      order: [["fecha_inicio", "DESC"]],
    },
    transaction ? { transaction } : {}
  );

  if (!contrato) {
    const error = new Error(
      "No se encontró contrato para este colaborador"
    );
    error.statusCode = 404;
    throw error;
  }

  const {
    causa,
    fechaTerminacion,
    realizo_preaviso = false,
    salarioDiario: salarioDiarioInput = null,
  } = datosEntrada;

  // Validaciones iniciales
  const validacion = validarDatosLiquidacion({
    idColaborador,
    causa,
    fechaTerminacion,
    fechaInicio: contrato.fecha_inicio,
    salarioDiario: salarioDiarioInput,
  });

  if (!validacion.esValido) {
    const error = new Error("Datos inválidos para simulación");
    error.statusCode = 400;
    error.errores = validacion.errores;
    throw error;
  }

  // Calcular o usar salario diario proporcionado
  let salarioDiario = salarioDiarioInput;
  let salarioDiarioOrigen = "proporcionado";

  if (!salarioDiario) {
    // Obtener promedio si no se proporciona
    const { promedioDiario } = await obtenerPromedioBases(
      idColaborador,
      3,
      transaction
    );
    salarioDiario = promedioDiario || calcularSalarioDiario(contrato.salario_base);
    salarioDiarioOrigen = "calculado";
  }

  // Calcular antigüedad
  const { diasTotales, meses, anios } = calcularAntiguedad(
    dayjs(contrato.fecha_inicio).format("YYYY-MM-DD"),
    fechaTerminacion
  );

  // Calcular cada componente
  const aguinaldo = await calcularAguinaldoProporcional(
    idColaborador,
    fechaTerminacion,
    causa,
    transaction
  );

  const vacaciones = await calcularVacacionesProporcionales(
    idColaborador,
    transaction
  );

  const cesantia = calcularCesantia(diasTotales, salarioDiario, causa);

  const preaviso = calcularPreaviso(
    diasTotales,
    salarioDiario,
    realizo_preaviso,
    causa
  );

  // Salarios pendientes (días no pagados al final)
  const salarioPendiente = calcularSalarioPendiente(0, salarioDiario);

  // Totales
  const totalBruto =
    aguinaldo.montoAguinaldo +
    vacaciones.montoVacaciones +
    cesantia.montoCesantia +
    preaviso.montoPreaviso +
    salarioPendiente.montoSalarioPendiente;

  const simulacion = {
    colaborador: {
      id: colaborador.id_colaborador,
      nombre: `${colaborador.nombre} ${colaborador.primer_apellido} ${colaborador.segundo_apellido}`,
      identificacion: colaborador.identificacion,
      fechaInicio: dayjs(contrato.fecha_inicio).format("YYYY-MM-DD"),
    },
    causa,
    fechaTerminacion,
    realizoPreaviso: realizo_preaviso,
    antiguedad: {
      diasTotales,
      meses,
      anios,
    },
    componentes: {
      salarioDiario: {
        valor: salarioDiario,
        origen: salarioDiarioOrigen,
      },
      aguinaldoProporcional: {
        valor: aguinaldo.montoAguinaldo,
        diasCalculados: aguinaldo.diasCalculados,
        periodo: aguinaldo.periodo,
        detalles: aguinaldo.detalles,
      },
      vacacionesProporcionales: {
        valor: vacaciones.montoVacaciones,
        diasPendientes: vacaciones.diasVacacionesPendientes,
        detalles: vacaciones.detalles,
      },
      cesantia: {
        valor: cesantia.montoCesantia,
        diasCalculados: cesantia.diasCesantia,
        detalles: cesantia.detalles,
      },
      preaviso: {
        valor: preaviso.montoPreaviso,
        diasCalculados: preaviso.diasPreaviso,
        detalles: preaviso.detalles,
      },
      salarioPendiente: {
        valor: salarioPendiente.montoSalarioPendiente,
        diasPendientes: salarioPendiente.diasPendientes,
      },
    },
    totales: {
      totalBruto,
      deducciones: 0, // Implementar si hay deducciones aplicables
      totalNeto: totalBruto,
    },
    validaciones: {
      esValido: true,
      errores: [],
      advertencias: validacion.advertencias,
    },
  };

  return simulacion;
}
