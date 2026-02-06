import dayjs from "dayjs";
import { Op, fn, col, literal } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../../mantenimientos_consultas/shared/transaction.js";
import {
  requireDateOnly,
  requirePositiveInt,
} from "../../../mantenimientos_consultas/shared/validators.js";
import {
  calculateHourlyRate,
  calculateRentaQuincenal,
  calculateDeduccionesObligatorias,
} from "../../shared/calculations.js";
import { ensureEstado } from "../../shared/resolvers.js";
import { roundCurrency, roundDecimal, serializePlanilla } from "../../shared/formatters.js";

const {
  PeriodoPlanilla,
  Contrato,
  JornadaDiaria,
  Planilla,
  Deduccion,
  DeduccionPlanilla,
} = models;

export const generarPlanillaQuincenal = (payload = {}) =>
  runInTransaction(async (transaction) => {
    const periodoId = requirePositiveInt(payload.id_periodo, "id_periodo");
    const fechaInicio = requireDateOnly(payload.fecha_inicio, "fecha_inicio");
    const fechaFin = requireDateOnly(payload.fecha_fin, "fecha_fin");
    const generadoPor = payload.generado_por ? requirePositiveInt(payload.generado_por, "generado_por") : null;

    if (dayjs(fechaInicio).isAfter(dayjs(fechaFin))) {
      throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
    }

    if (!Array.isArray(payload.colaboradores) || payload.colaboradores.length === 0) {
      throw new Error("Debe seleccionar al menos un colaborador");
    }

    const colaboradores = Array.from(
      new Set(
        payload.colaboradores.map((value) => requirePositiveInt(value, "colaboradores"))
      )
    );

    const periodo = await PeriodoPlanilla.findByPk(periodoId, { transaction });
    if (!periodo) throw new Error(`No existe un periodo de planilla con id ${periodoId}`);

    if (dayjs(fechaInicio).isBefore(dayjs(periodo.fecha_inicio)) || dayjs(fechaFin).isAfter(dayjs(periodo.fecha_fin))) {
      throw new Error("Las fechas indicadas deben pertenecer al periodo seleccionado");
    }

    const estadoActivo = await ensureEstado("ACTIVO", transaction);

    const deduccionesObligatorias = await Deduccion.findAll({
      where: { es_voluntaria: false },
      transaction,
    });

    const resultados = {
      generados: [],
      errores: [],
    };

    for (const colaboradorId of colaboradores) {
      try {
        const contrato = await Contrato.findOne({
          where: {
            id_colaborador: colaboradorId,
            estado: estadoActivo.id_estado,
          },
          order: [["fecha_inicio", "DESC"]],
          transaction,
        });

        if (!contrato) {
          throw new Error("El colaborador no tiene un contrato activo");
        }

        const horas = await obtenerHorasTrabajadas({
          colaboradorId,
          fechaInicio,
          fechaFin,
          transaction,
        });

        const salarioMensual = Number(contrato.salario_base);
        if (!Number.isFinite(salarioMensual) || salarioMensual <= 0) {
          throw new Error("El contrato no tiene un salario base mensual válido");
        }

        const horasSemanalesContrato = Number(contrato.horas_semanales);
        if (!Number.isFinite(horasSemanalesContrato) || horasSemanalesContrato <= 0) {
          throw new Error("El contrato no tiene horas semanales válidas");
        }

        const tarifaHora = calculateHourlyRate({
          salarioBase: contrato.salario_base,
          horasSemanales: contrato.horas_semanales,
        });

        const salarioQuincenal = roundCurrency(salarioMensual / 2);
        const expectedOrdinaryHours = horasSemanalesContrato * 2;

        const horasOrdinariasTrabajadas = Number(horas.ordinarias ?? 0);
        const horasNocturnasTrabajadas = Number(horas.nocturnas ?? 0);
        const horasFeriadoTrabajadas = Number(horas.feriado ?? 0);

        const nocturnasAplicables = Math.min(
          Math.max(expectedOrdinaryHours - horasOrdinariasTrabajadas, 0),
          Math.max(horasNocturnasTrabajadas, 0)
        );
        const horasCubiertas = horasOrdinariasTrabajadas + nocturnasAplicables;
        const horasAusencia = Math.max(0, roundDecimal(expectedOrdinaryHours - horasCubiertas));
        const deduccionAusencias = roundCurrency(tarifaHora * horasAusencia);

        const pagoBase = Math.max(0, roundCurrency(salarioQuincenal - deduccionAusencias));
        const pagoExtra = roundCurrency(tarifaHora * 1.5 * Number(horas.extra ?? 0));
        const pagoNocturno = roundCurrency(tarifaHora * 0.25 * horasNocturnasTrabajadas);
        const pagoFeriado = roundCurrency(tarifaHora * horasFeriadoTrabajadas);

        const bruto = roundCurrency(pagoBase + pagoExtra + pagoNocturno + pagoFeriado);

        const { total: totalDeduccionesObligatorias, detalle } = calculateDeduccionesObligatorias(
          bruto,
          deduccionesObligatorias
        );

        const renta = calculateRentaQuincenal(bruto);
        const totalDeducciones = roundCurrency(totalDeduccionesObligatorias + renta);
        const neto = Math.max(0, roundCurrency(bruto - totalDeducciones));

        const existing = await Planilla.findOne({
          where: { id_periodo: periodoId, id_colaborador: colaboradorId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        let detallePlanilla;
        if (existing) {
          await existing.update(
            {
              id_contrato: contrato.id_contrato,
              horas_ordinarias: roundDecimal(horas.ordinarias),
              horas_extra: roundDecimal(horas.extra),
              horas_nocturnas: roundDecimal(horas.nocturnas),
              horas_feriado: roundDecimal(horas.feriado),
              bruto,
              deducciones: totalDeducciones,
              neto,
            },
            { transaction }
          );
          detallePlanilla = existing;
        } else {
          detallePlanilla = await Planilla.create(
            {
              id_periodo: periodoId,
              id_colaborador: colaboradorId,
              id_contrato: contrato.id_contrato,
              horas_ordinarias: roundDecimal(horas.ordinarias),
              horas_extra: roundDecimal(horas.extra),
              horas_nocturnas: roundDecimal(horas.nocturnas),
              horas_feriado: roundDecimal(horas.feriado),
              bruto,
              deducciones: totalDeducciones,
              neto,
            },
            { transaction }
          );
        }

        await DeduccionPlanilla.destroy({
          where: { id_planilla: detallePlanilla.id_detalle },
          transaction,
        });

        for (const deduccion of detalle) {
          await DeduccionPlanilla.create(
            {
              id_planilla: detallePlanilla.id_detalle,
              id_deduccion: deduccion.id,
            },
            { transaction }
          );
        }

        resultados.generados.push({
          id_colaborador: colaboradorId,
          planilla: serializePlanilla({
            ...detallePlanilla.get({ plain: true }),
            bruto,
            deducciones: totalDeducciones,
            neto,
            generado_por: generadoPor,
          }),
          deducciones: {
            renta,
            obligatorias: detalle,
          },
        });
      } catch (error) {
        resultados.errores.push({
          id_colaborador: colaboradorId,
          motivo: error.message,
        });
      }
    }

    return resultados;
  });

async function obtenerHorasTrabajadas({ colaboradorId, fechaInicio, fechaFin, transaction }) {
  const row = await JornadaDiaria.findOne({
    attributes: [
      [fn("COALESCE", fn("SUM", col("horas_ordinarias")), 0), "horas_ordinarias"],
      [fn("COALESCE", fn("SUM", col("horas_extra")), 0), "horas_extra"],
      [fn("COALESCE", fn("SUM", col("horas_nocturnas")), 0), "horas_nocturnas"],
      [
        fn(
          "COALESCE",
          fn("SUM", literal("CASE WHEN feriado IS NOT NULL THEN horas_ordinarias ELSE 0 END")),
          0
        ),
        "horas_feriado",
      ],
    ],
    where: {
      id_colaborador: colaboradorId,
      fecha: { [Op.between]: [fechaInicio, fechaFin] },
    },
    raw: true,
    transaction,
  });

  return {
    ordinarias: Number(row?.horas_ordinarias ?? 0),
    extra: Number(row?.horas_extra ?? 0),
    nocturnas: Number(row?.horas_nocturnas ?? 0),
    feriado: Number(row?.horas_feriado ?? 0),
  };
}
