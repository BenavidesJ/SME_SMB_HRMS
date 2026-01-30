import { Op } from "sequelize";

export const obtenerDetallesPlanilla = async ({ models, payload }) => {
  const { id_periodo_planilla, id_colaboradores } = payload ?? {};

  if (!models?.sequelize) throw new Error("models.sequelize es requerido");

  const idPeriodo = Number(id_periodo_planilla);
  if (!Number.isInteger(idPeriodo) || idPeriodo <= 0) {
    throw new Error("id_periodo_planilla inválido");
  }

  if (!Array.isArray(id_colaboradores) || id_colaboradores.length === 0) {
    throw new Error("id_colaboradores es requerido");
  }

  const colaboradorIds = id_colaboradores.map((id) => Number(id));
  if (colaboradorIds.some((n) => !Number.isInteger(n) || n <= 0)) {
    throw new Error("id_colaboradores debe contener enteros positivos");
  }

  const periodo = await models.PeriodoPlanilla.findByPk(idPeriodo, {
    attributes: ["id_periodo"],
  });

  if (!periodo) {
    throw new Error(`No existe periodo planilla con id ${idPeriodo}`);
  }

  const detalles = await models.DetallePlanilla.findAll({
    where: {
      id_periodo: idPeriodo,
      id_colaborador: { [Op.in]: colaboradorIds },
    },
    order: [
      ["id_colaborador", "ASC"],
      ["id_detalle", "ASC"],
    ],
  });

  return {
    id_periodo: idPeriodo,
    total: detalles.length,
    detalles: detalles.map((row) => ({
      id_detalle: row.id_detalle,
      id_periodo: row.id_periodo,
      id_colaborador: row.id_colaborador,
      id_contrato: row.id_contrato,
      horas_ordinarias: Number(row.horas_ordinarias),
      horas_extra: Number(row.horas_extra),
      horas_feriado: Number(row.horas_feriado),
      horas_nocturnas: Number(row.horas_nocturnas),
      bruto: Number(row.bruto),
      deducciones: Number(row.deducciones),
      neto: Number(row.neto),
      generado_por: row.generado_por,
    })),
  };
};