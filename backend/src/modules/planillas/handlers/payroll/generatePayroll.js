import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../../mantenimientos_consultas/shared/transaction.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import { roundDecimal, serializePlanilla } from "../../shared/formatters.js";
import {
  calcularPlanillaColaborador,
  cargarDatosGlobalesPeriodo,
} from "./payrollCalculator.js";

const { Planilla, DeduccionPlanilla } = models;

/**
 * Genera y persiste la planilla quincenal para uno o más colaboradores.
 * Detecta duplicados (planillas creadas previamente para el mismo periodo+colaborador).
 *
 * @param {{
 *   id_periodo: number,
 *   colaboradores: number[],
 *   generado_por?: number
 * }} payload
 */
export const generarPlanillaQuincenal = (payload = {}) =>
  runInTransaction(async (transaction) => {
    // ── Validar entrada ──
    const periodoId = requirePositiveInt(payload.id_periodo, "id_periodo");
    const generadoPor = payload.generado_por
      ? requirePositiveInt(payload.generado_por, "generado_por")
      : null;

    if (!Array.isArray(payload.colaboradores) || payload.colaboradores.length === 0) {
      throw new Error("Debe seleccionar al menos un colaborador");
    }

    const colaboradores = Array.from(
      new Set(payload.colaboradores.map((v) => requirePositiveInt(v, "colaboradores")))
    );

    // ── Datos globales del período ──
    const {
      fechaInicio,
      fechaFin,
      feriadosFechas,
      deduccionesObligatorias,
      estadoActivo,
    } = await cargarDatosGlobalesPeriodo({ periodoId, transaction });

    const resultados = { generados: [], duplicados: [], errores: [] };

    // ── Iterar colaboradores ──
    for (const colaboradorId of colaboradores) {
      try {
        // Verificar si ya existe planilla para este periodo+colaborador
        const existente = await Planilla.findOne({
          where: { id_periodo: periodoId, id_colaborador: colaboradorId },
          transaction,
        });

        if (existente) {
          resultados.duplicados.push({
            id_colaborador: colaboradorId,
            id_detalle: existente.id_detalle,
          });
          continue;
        }

        // Calcular usando utility pura
        const calculo = await calcularPlanillaColaborador({
          colaboradorId,
          periodoId,
          fechaInicio,
          fechaFin,
          feriadosFechas,
          deduccionesObligatorias,
          estadoActivo,
          transaction,
        });

        // Persistir en tabla planilla
        const detallePlanilla = await Planilla.create(
          {
            id_periodo: periodoId,
            id_colaborador: colaboradorId,
            ...calculo.dataPlanilla,
          },
          { transaction }
        );

        // Persistir detalle de deducciones
        for (const ded of calculo.deduccionesDetalle) {
          await DeduccionPlanilla.create(
            {
              id_planilla: detallePlanilla.id_detalle,
              id_deduccion: ded.id,
              monto: ded.monto,
            },
            { transaction }
          );
        }

        resultados.push({
          id_colaborador: colaboradorId,
          nombre_completo: nombreCompleto,
          identificacion: empleado?.identificacion ?? null,
          salario_mensual: calculo.salarioMensual,
          salario_quincenal_base: calculo.salarioQuincenal,
          salario_ordinario_programado: calculo.salarioOrdinarioProgramado,
          salario_ordinario: calculo.salarioOrdinario,
          salario_diario: calculo.salarioDiario,
          tarifa_hora: roundCurrency(calculo.tarifaHora),
          horas_ordinarias: {
            cantidad: calculo.resumenDias.totalHorasOrdinariasPagadas,
            programadas: calculo.resumenDias.totalHorasOrdinariasProgramadas,
            trabajadas: calculo.resumenDias.totalHorasOrdinariasTrabajadas,
            vacaciones: calculo.resumenDias.totalHorasVacacionesPagadas,
            permisos_con_goce: calculo.resumenDias.totalHorasPermisosConGocePagadas,
            feriado_no_trabajado: calculo.resumenDias.totalHorasFeriadoPagadoNoTrabajado,
            incapacidad_cubiertas_patrono: calculo.resumenDias.totalHorasIncapacidadCubiertas,
            total_no_pagadas: calculo.resumenDias.totalHorasNoPagadas,
            monto: calculo.salarioOrdinario,
          },
          descuentos_dias: {
            ausencias: {
              dias: calculo.resumenDias.diasAusencias,
              horas: calculo.resumenDias.totalHorasAusenciaInjustificada,
              monto: calculo.resumenDias.montoDescuentoAusencias,
            },
            incapacidad: {
              dias: calculo.resumenDias.diasIncapacidad,
              horas_cubiertas_patrono: calculo.resumenDias.totalHorasIncapacidadCubiertas,
              horas_no_cubiertas: calculo.resumenDias.totalHorasIncapacidadNoCubiertas,
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
        resultados.errores.push({
          id_colaborador: colaboradorId,
          motivo: error.message,
        });
      }
    }

    // Si TODOS son duplicados, lanzar error 409
    if (resultados.generados.length === 0 && resultados.duplicados.length > 0) {
      const err = new Error(
        "Todos los colaboradores seleccionados ya tienen planilla generada para este periodo. Utilice la opción de recalcular."
      );
      err.statusCode = 409;
      err.data = { duplicados: resultados.duplicados };
      throw err;
    }

    return {
      ...resultados,
      mensaje:
        resultados.duplicados.length > 0
          ? `Se generaron ${resultados.generados.length} planillas. ${resultados.duplicados.length} colaborador(es) ya tenían planilla para este periodo.`
          : `Se generaron ${resultados.generados.length} planillas exitosamente.`,
    };
  });
