import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import { ensureEstado } from "../../shared/resolvers.js";

const { Contrato, PeriodoPlanilla } = models;

function buildNombreCompleto(colaborador) {
  return [
    colaborador?.nombre,
    colaborador?.primer_apellido,
    colaborador?.segundo_apellido,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function listarColaboradoresElegiblesPeriodo(
  { periodoId, transaction, periodo: providedPeriodo } = {},
) {
  const resolvedPeriodoId = requirePositiveInt(periodoId, "periodoId");

  const periodo = providedPeriodo
    ?? await PeriodoPlanilla.findByPk(resolvedPeriodoId, {
      attributes: ["id_periodo", "fecha_inicio", "fecha_fin", "estado"],
      transaction,
    });

  if (!periodo) {
    throw new Error(
      `No existe un periodo de planilla con id ${resolvedPeriodoId}`,
    );
  }

  const estadoActivo = await ensureEstado("ACTIVO", transaction);

  const contratos = await Contrato.findAll({
    attributes: ["id_contrato", "id_colaborador", "fecha_inicio"],
    where: {
      estado: estadoActivo.id_estado,
      fecha_inicio: { [Op.lt]: periodo.fecha_inicio },
    },
    include: [
      {
        association: "colaborador",
        attributes: [
          "id_colaborador",
          "nombre",
          "primer_apellido",
          "segundo_apellido",
          "identificacion",
        ],
        required: true,
        where: {
          estado: estadoActivo.id_estado,
        },
      },
      {
        association: "planillas",
        attributes: ["id_detalle", "id_periodo"],
        where: { id_periodo: resolvedPeriodoId },
        required: false,
      },
    ],
    order: [
      ["id_colaborador", "ASC"],
      ["fecha_inicio", "DESC"],
      ["id_contrato", "DESC"],
    ],
    transaction,
  });

  const latestContratoByColaborador = new Map();

  for (const contrato of contratos) {
    const collaboratorId = Number(contrato.id_colaborador);
    if (!latestContratoByColaborador.has(collaboratorId)) {
      latestContratoByColaborador.set(collaboratorId, contrato);
    }
  }

  const colaboradores = Array.from(latestContratoByColaborador.values()).map(
    (contrato) => ({
      id_colaborador: Number(contrato.id_colaborador),
      id_contrato: Number(contrato.id_contrato),
      nombre_completo: buildNombreCompleto(contrato.colaborador),
      identificacion: contrato.colaborador?.identificacion ?? null,
      fecha_inicio_contrato: contrato.fecha_inicio,
      tiene_planilla: Array.isArray(contrato.planillas) && contrato.planillas.length > 0,
    }),
  );

  const totalGenerados = colaboradores.filter(
    (colaborador) => colaborador.tiene_planilla,
  ).length;

  return {
    id_periodo: Number(periodo.id_periodo),
    fecha_inicio: periodo.fecha_inicio,
    fecha_fin: periodo.fecha_fin,
    colaboradores,
    total_elegibles: colaboradores.length,
    total_generados: totalGenerados,
    total_pendientes: colaboradores.length - totalGenerados,
  };
}

export async function evaluarAprobacionPeriodoPlanilla(
  { periodoId, transaction } = {},
) {
  const resolvedPeriodoId = requirePositiveInt(periodoId, "periodoId");

  const periodo = await PeriodoPlanilla.findByPk(resolvedPeriodoId, {
    attributes: ["id_periodo", "fecha_inicio", "fecha_fin", "estado"],
    transaction,
    lock: transaction?.LOCK?.UPDATE,
  });

  if (!periodo) {
    throw new Error(
      `No existe un periodo de planilla con id ${resolvedPeriodoId}`,
    );
  }

  const elegibles = await listarColaboradoresElegiblesPeriodo({
    periodoId: resolvedPeriodoId,
    transaction,
    periodo,
  });

  const aprobado =
    elegibles.total_elegibles > 0
    && elegibles.total_generados >= elegibles.total_elegibles;

  let estadoActualizado = false;

  if (aprobado) {
    const estadoAprobado = await ensureEstado("APROBADO", transaction);
    if (Number(periodo.estado) !== Number(estadoAprobado.id_estado)) {
      await periodo.update({ estado: estadoAprobado.id_estado }, { transaction });
      estadoActualizado = true;
    }
  }

  return {
    aprobado,
    estado_actualizado: estadoActualizado,
    total_elegibles: elegibles.total_elegibles,
    total_generados: elegibles.total_generados,
    total_pendientes: elegibles.total_pendientes,
  };
}