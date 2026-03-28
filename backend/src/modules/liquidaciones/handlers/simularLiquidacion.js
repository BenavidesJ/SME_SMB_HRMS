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
  obtenerDiasPendientesSalario,
  validarDatosLiquidacion,
} from "../utils/liquidacionCalculator.js";
import { fn, col, where } from "sequelize";
import { Colaborador, Contrato, CausaLiquidacion } from "../../../models/index.js";

function normalizarTexto(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function clasificarTipoCausa(causaSeleccionada, catalogo) {
  const idSeleccionado = Number(causaSeleccionada.id_causa_liquidacion);

  const idsConResponsabilidad = new Set(
    catalogo
      .filter((row) => normalizarTexto(row.causa_liquidacion).includes("CON RESPONSABILIDAD"))
      .map((row) => Number(row.id_causa_liquidacion))
  );
  const idsSinResponsabilidad = new Set(
    catalogo
      .filter((row) => normalizarTexto(row.causa_liquidacion).includes("SIN RESPONSABILIDAD"))
      .map((row) => Number(row.id_causa_liquidacion))
  );
  const idsRenuncia = new Set(
    catalogo
      .filter((row) => normalizarTexto(row.causa_liquidacion).includes("RENUNCIA"))
      .map((row) => Number(row.id_causa_liquidacion))
  );

  if (idsSinResponsabilidad.has(idSeleccionado)) return "DESPIDO_SIN_RESPONSABILIDAD";
  if (idsConResponsabilidad.has(idSeleccionado)) return "DESPIDO_CON_RESPONSABILIDAD";
  if (idsRenuncia.has(idSeleccionado)) return "RENUNCIA";
  return "OTRA";
}

/**
 * Simula el cálculo de liquidación sin guardar en BD
 * Retorna desglose completo para que el usuario confirme o ajuste
 * @param {number} idColaborador
 * @param {object} datosEntrada - {causa o causaId, fechaTerminacion, realizo_preaviso, salarioDiario (opcional)}
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
      ...(transaction ? { transaction } : {}),
    },
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
    causaId,
    fechaTerminacion,
    realizo_preaviso = false,
    salarioDiario: salarioDiarioInput = null,
  } = datosEntrada;

  const causaCatalogo = await CausaLiquidacion.findAll({
    attributes: ["id_causa_liquidacion", "causa_liquidacion"],
    ...(transaction ? { transaction } : {}),
  });

  let causaSeleccionada = null;
  if (causaId) {
    causaSeleccionada = causaCatalogo.find(
      (row) => Number(row.id_causa_liquidacion) === Number(causaId)
    );
  }

  if (!causaSeleccionada && causa) {
    causaSeleccionada = await CausaLiquidacion.findOne({
      where: where(
        fn("LOWER", col("causa_liquidacion")),
        String(causa).trim().toLowerCase()
      ),
      ...(transaction ? { transaction } : {}),
    });
  }

  if (!causaSeleccionada) {
    const error = new Error("Causa de liquidación inválida");
    error.statusCode = 400;
    throw error;
  }

  const causaRegla = {
    id: Number(causaSeleccionada.id_causa_liquidacion),
    nombre: String(causaSeleccionada.causa_liquidacion),
    tipo: clasificarTipoCausa(causaSeleccionada, causaCatalogo),
  };

  // Validaciones iniciales
  const validacion = validarDatosLiquidacion({
    idColaborador,
    causa: causaRegla.nombre,
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
    causaRegla,
    transaction
  );

  const vacaciones = await calcularVacacionesProporcionales(
    idColaborador,
    transaction,
    fechaTerminacion,
    dayjs(contrato.fecha_inicio).format("YYYY-MM-DD")
  );

  const cesantia = calcularCesantia(diasTotales, salarioDiario, causaRegla);

  const preaviso = calcularPreaviso(
    diasTotales,
    salarioDiario,
    realizo_preaviso,
    causaRegla
  );

  // Salarios pendientes: días posteriores al último período de planilla aprobado.
  const infoSalarioPendiente = await obtenerDiasPendientesSalario(
    idColaborador,
    fechaTerminacion,
    transaction
  );
  const salarioPendiente = calcularSalarioPendiente(
    infoSalarioPendiente.diasPendientes,
    salarioDiario
  );

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
    causa: causaRegla.nombre,
    causaId: causaRegla.id,
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
        fechaUltimoPago: infoSalarioPendiente.fechaUltimoPago,
        detalles: infoSalarioPendiente.detalles,
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
