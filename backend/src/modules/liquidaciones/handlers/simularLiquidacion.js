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
  normalizarTexto,
  resolverTipoCausa,
  contarDiasLaboralesSemana,
  validarDatosLiquidacion,
} from "../utils/liquidacionCalculator.js";
import { Colaborador, Contrato, HorarioLaboral, CausaLiquidacion } from "../../../models/index.js";

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

  const horario = await HorarioLaboral.findOne({
    where: { id_contrato: contrato.id_contrato },
    order: [["fecha_actualizacion", "DESC"]],
    ...(transaction ? { transaction } : {}),
  });

  const {
    causa,
    causaId,
    fechaTerminacion,
    realizo_preaviso: realizoPreavisoRaw = false,
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
    const causaNormalizada = normalizarTexto(causa);
    causaSeleccionada = causaCatalogo.find(
      (row) => normalizarTexto(row.causa_liquidacion) === causaNormalizada
    );
  }

  if (!causaSeleccionada) {
    const error = new Error("Causa de liquidación inválida");
    error.statusCode = 400;
    throw error;
  }

  const causaRegla = {
    id: Number(causaSeleccionada.id_causa_liquidacion),
    nombre: String(causaSeleccionada.causa_liquidacion),
    tipo: resolverTipoCausa(String(causaSeleccionada.causa_liquidacion)),
  };

  const realizoPreaviso =
    causaRegla.tipo === "DESPIDO_SIN_RESPONSABILIDAD"
      ? false
      : causaRegla.tipo === "DESPIDO_CON_RESPONSABILIDAD"
        ? true
        : Boolean(realizoPreavisoRaw);

  const diasLaboralesDesdeHorario = contarDiasLaboralesSemana(horario?.dias_laborales);
  const diasLaboralesSemana = diasLaboralesDesdeHorario > 0 ? diasLaboralesDesdeHorario : 5;

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
    realizoPreaviso,
    causaRegla,
    { diasLaboralesSemana }
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

  const advertencias = [...validacion.advertencias];

  if (!horario) {
    advertencias.push(
      "No se encontró horario laboral activo; preaviso de semana laboral se calculó con 5 días"
    );
  }

  if (causaRegla.tipo === "DESPIDO_SIN_RESPONSABILIDAD" && Boolean(realizoPreavisoRaw)) {
    advertencias.push(
      "Preaviso se ajustó a NO porque no aplica para despido sin responsabilidad"
    );
  }

  if (causaRegla.tipo === "DESPIDO_CON_RESPONSABILIDAD" && !Boolean(realizoPreavisoRaw)) {
    advertencias.push(
      "Preaviso se ajustó a SI porque aplica por defecto para despido con responsabilidad"
    );
  }

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
    realizoPreaviso,
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
      advertencias,
    },
  };

  return simulacion;
}
