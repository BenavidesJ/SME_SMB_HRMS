import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import {
  requirePositiveInt,
} from "../../../mantenimientos_consultas/shared/validators.js";
import { roundCurrency, toNumber } from "../../shared/formatters.js";
import {
  calculateHourlyRate,
  calculateDailyRate,
  calcularRentaProyectada,
} from "../../shared/calculations.js";

const { Planilla } = models;

/**
 * Construye el desglose enriquecido de una planilla a partir de datos persistidos.
 */
function buildDetalleEnriquecido(planilla, contrato, deduccionesDetalle) {
  const salarioMensual = toNumber(contrato?.salario_base);
  const horasSemanales = toNumber(contrato?.horas_semanales);
  const salarioQuincenal = roundCurrency(salarioMensual / 2);
  const salarioDiario = salarioMensual > 0 ? roundCurrency(salarioMensual / 30) : 0;

  let tarifaHora = 0;
  if (salarioMensual > 0 && horasSemanales > 0) {
    tarifaHora = calculateHourlyRate({ salarioBase: salarioMensual, horasSemanales });
  }

  const horasOrdinarias = toNumber(planilla.horas_ordinarias);
  const horasExtra = toNumber(planilla.horas_extra);
  const horasNocturnas = toNumber(planilla.horas_nocturnas);
  const horasFeriado = toNumber(planilla.horas_feriado);
  const bruto = toNumber(planilla.bruto);
  const totalDeducciones = toNumber(planilla.deducciones);
  const neto = toNumber(planilla.neto);

  // Montos de extras/nocturnos/feriados
  const montoExtra = roundCurrency(horasExtra * tarifaHora * 1.5);
  const montoNocturno = roundCurrency(horasNocturnas * tarifaHora * 0.25);
  const montoFeriado = roundCurrency(horasFeriado * tarifaHora);

  // Renta proyectada (recalcular desde bruto)
  const renta = calcularRentaProyectada(bruto);

  // Deducciones detalladas (cargas sociales, sin renta)
  const deducciones = deduccionesDetalle.map((dp) => {
    const deduccion = dp.deduccion;
    const porcentaje = toNumber(deduccion?.valor);
    const monto = roundCurrency((bruto * porcentaje) / 100);
    return {
      id_deduccion: dp.id_deduccion,
      nombre: deduccion?.nombre ?? "Deducción",
      porcentaje,
      monto,
    };
  });

  const totalCargasSociales = roundCurrency(
    deducciones.reduce((acc, d) => acc + d.monto, 0)
  );

  return {
    id_detalle: planilla.id_detalle,
    id_periodo: planilla.id_periodo,
    id_colaborador: planilla.id_colaborador,
    id_contrato: planilla.id_contrato,

    // Tarifas de referencia
    salario_mensual: salarioMensual,
    salario_quincenal: salarioQuincenal,
    salario_diario: salarioDiario,
    tarifa_hora: roundCurrency(tarifaHora),

    // Horas + montos
    horas_ordinarias: { cantidad: horasOrdinarias, monto: roundCurrency(bruto - montoExtra - montoNocturno - montoFeriado) },
    horas_extra: { cantidad: horasExtra, monto: montoExtra },
    horas_nocturnas: { cantidad: horasNocturnas, monto: montoNocturno },
    horas_feriado: { cantidad: horasFeriado, monto: montoFeriado },

    // Salario devengado
    salario_devengado: bruto,

    // Deducciones detalladas
    deducciones,
    total_cargas_sociales: totalCargasSociales,

    // Renta
    renta,

    // Totales
    total_deducciones: totalDeducciones,
    salario_neto: neto,
  };
}

export const obtenerDetallePlanilla = async ({ id_periodo, colaboradores }) => {
  const periodoId = requirePositiveInt(id_periodo, "id_periodo");
  if (!Array.isArray(colaboradores) || colaboradores.length === 0) {
    throw new Error("Debe indicar al menos un colaborador");
  }
  const ids = colaboradores.map((value) => requirePositiveInt(value, "colaboradores"));

  const registros = await Planilla.findAll({
    where: {
      id_periodo: periodoId,
      id_colaborador: { [Op.in]: ids },
    },
    include: [
      {
        association: "contrato",
        attributes: ["id_contrato", "salario_base", "horas_semanales"],
        required: false,
      },
      {
        association: "deduccionesDetalle",
        attributes: ["id_planilla", "id_deduccion"],
        include: [
          {
            association: "deduccion",
            attributes: ["id_deduccion", "nombre", "valor"],
          },
        ],
      },
    ],
    order: [["id_colaborador", "ASC"]],
  });

  const detalles = registros.map((registro) =>
    buildDetalleEnriquecido(registro, registro.contrato, registro.deduccionesDetalle ?? [])
  );

  const total = roundCurrency(detalles.reduce((acc, item) => acc + item.salario_neto, 0));

  return {
    id_periodo: periodoId,
    total,
    detalles,
  };
};
