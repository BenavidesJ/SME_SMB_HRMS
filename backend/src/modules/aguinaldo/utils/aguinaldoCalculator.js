import { Op, fn, col, literal } from "sequelize";
import {
  Planilla,
  PeriodoPlanilla,
  Aguinaldo,
} from "../../../models/index.js";

/**
 * Obtiene la suma de salarios brutos agrupados por mes para un colaborador
 * dentro de un rango de fechas.
 *
 * Cada periodo de planilla (quincena) se asigna al mes de su fecha_inicio.
 * Se suman todos los registros de `bruto` de la tabla planilla cuyo
 * periodo_planilla.fecha_inicio caiga dentro del rango solicitado.
 *
 * @param {number} idColaborador
 * @param {string} periodoDesde  – YYYY-MM-DD
 * @param {string} periodoHasta  – YYYY-MM-DD
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<{mes: number, anio: number, total: number}[]>}
 */
export async function obtenerSalariosPorMes(
  idColaborador,
  periodoDesde,
  periodoHasta,
  transaction,
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
 * Calcula el monto de aguinaldo para un colaborador.
 *
 * Fórmula: Σ(salarios brutos en el período) / 12
 *
 * @param {number} idColaborador
 * @param {string} periodoDesde  – YYYY-MM-DD
 * @param {string} periodoHasta  – YYYY-MM-DD
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<{desglose: {mes: number, anio: number, total: number}[], totalBruto: number, montoAguinaldo: number}>}
 */
export async function calcularMontoPorColaborador(
  idColaborador,
  periodoDesde,
  periodoHasta,
  transaction,
) {
  const desglose = await obtenerSalariosPorMes(
    idColaborador,
    periodoDesde,
    periodoHasta,
    transaction,
  );

  const totalBruto = desglose.reduce((acc, row) => acc + row.total, 0);
  const montoAguinaldo = Math.round((totalBruto / 12) * 100) / 100;

  return { desglose, totalBruto, montoAguinaldo };
}

/**
 * Verifica si ya existe un registro de aguinaldo para un colaborador
 * cuyo período coincida (mismo año).
 *
 * @param {number} idColaborador
 * @param {number} anio
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<import("sequelize").Model|null>}
 */
export async function buscarAguinaldoExistente(
  idColaborador,
  anio,
  transaction,
) {
  return Aguinaldo.findOne({
    where: { id_colaborador: idColaborador, anio },
    ...(transaction ? { transaction } : {}),
  });
}

/**
 * Devuelve el rango de fechas por defecto para el aguinaldo
 * según el año dado.
 *
 * Periodo legal: 1-Dic del año anterior → 30-Nov del año actual.
 *
 * @param {number} anio – Año del aguinaldo (año de pago)
 * @returns {{ periodoDesde: string, periodoHasta: string }}
 */
export function calcularPeriodoDefault(anio) {
  const periodoDesde = `${anio - 1}-12-01`;
  const periodoHasta = `${anio}-11-30`;
  return { periodoDesde, periodoHasta };
}
