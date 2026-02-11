import { Colaborador } from "../../../../models/index.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import { roundCurrency } from "../../shared/formatters.js";
import {
  calcularPlanillaColaborador,
  cargarDatosGlobalesPeriodo,
} from "./payrollCalculator.js";

/**
 * Simula el cálculo de planilla quincenal para uno o más colaboradores.
 * No persiste nada en BD — solo devuelve el preview con montos calculados.
 *
 * @param {{
 *   id_periodo: number,
 *   colaboradores: number[]
 * }} payload
 * @returns {Promise<{ id_periodo: number, fecha_inicio: string, fecha_fin: string, total_colaboradores: number, total_neto: number, resultados: object[], errores: object[] }>}
 */
export async function simularPlanillaQuincenal(payload = {}) {
  // ── Validar entrada ──
  const periodoId = requirePositiveInt(payload.id_periodo, "id_periodo");

  if (!Array.isArray(payload.colaboradores) || payload.colaboradores.length === 0) {
    throw new Error("Debe seleccionar al menos un colaborador");
  }

  const colaboradores = Array.from(
    new Set(payload.colaboradores.map((v) => requirePositiveInt(v, "colaboradores")))
  );

  // ── Datos globales (lectura) ──
  const {
    fechaInicio,
    fechaFin,
    feriadosFechas,
    deduccionesObligatorias,
    estadoActivo,
  } = await cargarDatosGlobalesPeriodo({ periodoId });

  // Obtener nombres de los colaboradores para el preview
  const empleados = await Colaborador.findAll({
    attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido", "identificacion"],
    where: { id_colaborador: colaboradores },
    raw: true,
  });
  const empleadosMap = new Map(empleados.map((e) => [e.id_colaborador, e]));

  const resultados = [];
  const errores = [];

  // ── Iterar colaboradores ──
  for (const colaboradorId of colaboradores) {
    const empleado = empleadosMap.get(colaboradorId);
    const nombreCompleto = empleado
      ? [empleado.nombre, empleado.primer_apellido, empleado.segundo_apellido]
          .filter(Boolean)
          .join(" ")
      : `Colaborador #${colaboradorId}`;

    try {
      const calculo = await calcularPlanillaColaborador({
        colaboradorId,
        periodoId,
        fechaInicio,
        fechaFin,
        feriadosFechas,
        deduccionesObligatorias,
        estadoActivo,
      });

      resultados.push({
        id_colaborador: colaboradorId,
        nombre_completo: nombreCompleto,
        identificacion: empleado?.identificacion ?? null,
        salario_mensual: calculo.salarioMensual,
        salario_quincenal_base: calculo.salarioQuincenal,
        salario_diario: calculo.salarioDiario,
        tarifa_hora: roundCurrency(calculo.tarifaHora),
        descuentos_dias: {
          ausencias: {
            dias: calculo.resumenDias.diasAusencias,
            monto: calculo.resumenDias.montoDescuentoAusencias,
          },
          incapacidad: {
            dias: calculo.resumenDias.diasIncapacidad,
            monto: calculo.resumenDias.montoDescuentoIncapacidad,
          },
          total: calculo.resumenDias.totalDescuentosDias,
        },
        horas_extra: { cantidad: calculo.resumenDias.totalHorasExtra, monto: calculo.pagoExtra },
        horas_nocturnas: { cantidad: calculo.resumenDias.totalHorasNocturnas, monto: calculo.pagoNocturno },
        horas_feriado: { cantidad: calculo.resumenDias.totalHorasFeriado, monto: calculo.pagoFeriado },
        salario_devengado: calculo.bruto,
        deducciones_detalle: calculo.deduccionesDetalle,
        renta: calculo.renta,
        total_deducciones: calculo.totalDescuentos,
        salario_neto: calculo.neto,
        detalles_calculo: calculo.detalles_calculo,
        error: null,
      });
    } catch (error) {
      errores.push({
        id_colaborador: colaboradorId,
        nombre_completo: nombreCompleto,
        motivo: error.message,
      });
    }
  }

  const totalNeto = roundCurrency(resultados.reduce((acc, r) => acc + r.salario_neto, 0));

  return {
    id_periodo: periodoId,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    total_colaboradores: resultados.length,
    total_neto: totalNeto,
    resultados,
    errores,
  };
}
