import { models, Colaborador } from "../../../../models/index.js";
import { runInTransaction } from "../../../mantenimientos_consultas/shared/transaction.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import { serializePlanilla, roundCurrency } from "../../shared/formatters.js";
import {
  calcularPlanillaColaborador,
  cargarDatosGlobalesPeriodo,
} from "./payrollCalculator.js";

const { Planilla, DeduccionPlanilla } = models;

/**
 * Recalcula planillas existentes para un periodo y colaboradores dados.
 * Solo actualiza registros que ya existen.
 *
 * @param {{
 *   id_periodo: number,
 *   colaboradores: number[],
 *   generado_por?: number
 * }} payload
 */
export const recalcularPlanilla = (payload = {}) =>
  runInTransaction(async (transaction) => {
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

    // Datos globales del período
    const {
      fechaInicio,
      fechaFin,
      feriadosFechas,
      deduccionesObligatorias,
      estadoActivo,
    } = await cargarDatosGlobalesPeriodo({ periodoId, transaction });

    // Nombres
    const empleados = await Colaborador.findAll({
      attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
      where: { id_colaborador: colaboradores },
      raw: true,
    });
    const empleadosMap = new Map(empleados.map((e) => [e.id_colaborador, e]));

    const recalculados = [];
    const errores = [];

    for (const colaboradorId of colaboradores) {
      const empleado = empleadosMap.get(colaboradorId);
      const nombreCompleto = empleado
        ? [empleado.nombre, empleado.primer_apellido, empleado.segundo_apellido]
            .filter(Boolean)
            .join(" ")
        : `Colaborador #${colaboradorId}`;

      try {
        // Buscar planilla existente
        const existente = await Planilla.findOne({
          where: { id_periodo: periodoId, id_colaborador: colaboradorId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!existente) {
          errores.push({
            id_colaborador: colaboradorId,
            nombre_completo: nombreCompleto,
            motivo: "No existe planilla previa para recalcular",
          });
          continue;
        }

        const netoAnterior = Number(existente.neto);

        // Recalcular
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

        // Actualizar registro
        await existente.update(calculo.dataPlanilla, { transaction });

        // Recalcular deducciones
        await DeduccionPlanilla.destroy({
          where: { id_planilla: existente.id_detalle },
          transaction,
        });

        for (const ded of calculo.deduccionesDetalle) {
          await DeduccionPlanilla.create(
            {
              id_planilla: existente.id_detalle,
              id_deduccion: ded.id,
              monto: ded.monto,
            },
            { transaction }
          );
        }

        recalculados.push({
          id_colaborador: colaboradorId,
          nombre_completo: nombreCompleto,
          id_detalle: existente.id_detalle,
          neto_anterior: netoAnterior,
          neto_nuevo: calculo.neto,
          diferencia: roundCurrency(calculo.neto - netoAnterior),
        });
      } catch (error) {
        errores.push({
          id_colaborador: colaboradorId,
          nombre_completo: nombreCompleto,
          motivo: error.message,
        });
      }
    }

    return {
      total_recalculados: recalculados.length,
      recalculados,
      errores,
    };
  });
