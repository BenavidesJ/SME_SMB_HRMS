import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../../mantenimientos_consultas/shared/transaction.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import { evaluarAprobacionPeriodoPlanilla } from "./eligibleCollaborators.js";
import {
  calcularPlanillaColaborador,
  cargarDatosGlobalesPeriodo,
} from "./payrollCalculator.js";

const { Planilla, DeduccionPlanilla, Colaborador } = models;

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
    const periodoId = requirePositiveInt(payload.id_periodo, "id_periodo");

    if (payload.generado_por !== undefined && payload.generado_por !== null) {
      requirePositiveInt(payload.generado_por, "generado_por");
    }

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

    const empleados = await Colaborador.findAll({
      attributes: [
        "id_colaborador",
        "nombre",
        "primer_apellido",
        "segundo_apellido",
        "identificacion",
      ],
      where: { id_colaborador: colaboradores },
      raw: true,
      transaction,
    });

    const empleadosMap = new Map(
      empleados.map((empleado) => [Number(empleado.id_colaborador), empleado]),
    );

    const resultados = { generados: [], duplicados: [], errores: [] };

    for (const colaboradorId of colaboradores) {
      const empleado = empleadosMap.get(colaboradorId);
      const nombreCompleto = empleado
        ? [
          empleado.nombre,
          empleado.primer_apellido,
          empleado.segundo_apellido,
        ]
            .filter(Boolean)
            .join(" ")
        : `Colaborador #${colaboradorId}`;

      try {
        const existente = await Planilla.findOne({
          where: { id_periodo: periodoId, id_colaborador: colaboradorId },
          transaction,
        });

        if (existente) {
          resultados.duplicados.push({
            id_colaborador: colaboradorId,
            nombre_completo: nombreCompleto,
            id_detalle: existente.id_detalle,
          });
          continue;
        }

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

        const detallePlanilla = await Planilla.create(
          {
            id_periodo: periodoId,
            id_colaborador: colaboradorId,
            ...calculo.dataPlanilla,
          },
          { transaction }
        );

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

        resultados.generados.push({
          id_colaborador: colaboradorId,
          nombre_completo: nombreCompleto,
          identificacion: empleado?.identificacion ?? null,
          salario_neto: calculo.neto,
          id_detalle: detallePlanilla.id_detalle,
          id_contrato: calculo.id_contrato,
        });
      } catch (error) {
        resultados.errores.push({
          id_colaborador: colaboradorId,
          nombre_completo: nombreCompleto,
          motivo: error.message,
        });
      }
    }

    if (resultados.generados.length === 0 && resultados.duplicados.length > 0 && resultados.errores.length === 0) {
      const err = new Error(
        "Todos los colaboradores seleccionados ya tienen planilla generada para este periodo. Utilice la opción de recalcular."
      );
      err.statusCode = 409;
      err.data = { duplicados: resultados.duplicados };
      throw err;
    }

    if (resultados.generados.length === 0 && resultados.errores.length > 0) {
      const err = new Error(
        resultados.errores[0]?.motivo
        || "No se pudo generar ninguna planilla seleccionada."
      );
      err.statusCode = 400;
      err.data = {
        duplicados: resultados.duplicados,
        errores: resultados.errores,
      };
      throw err;
    }

    const aprobacion = await evaluarAprobacionPeriodoPlanilla({
      periodoId,
      transaction,
    });

    const mensajes = [
      `Se generaron ${resultados.generados.length} planilla(s) exitosamente.`,
    ];

    if (resultados.duplicados.length > 0) {
      mensajes.push(
        `${resultados.duplicados.length} colaborador(es) ya tenían planilla para este periodo.`,
      );
    }

    if (resultados.errores.length > 0) {
      mensajes.push(
        `${resultados.errores.length} colaborador(es) no pudieron generarse.`,
      );
    }

    if (aprobacion.estado_actualizado) {
      mensajes.push("El periodo cambió automáticamente a APROBADO.");
    }

    return {
      ...resultados,
      aprobacion,
      mensaje: mensajes.join(" "),
    };
  });
