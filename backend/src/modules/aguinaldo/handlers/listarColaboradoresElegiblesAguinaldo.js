import { Op } from "sequelize";
import { Aguinaldo, Contrato, Colaborador } from "../../../models/index.js";
import { ensureEstado } from "../../planillas/shared/resolvers.js";

function buildNombreCompleto(colaborador) {
  return [
    colaborador?.nombre,
    colaborador?.primer_apellido,
    colaborador?.segundo_apellido,
  ]
    .filter(Boolean)
    .join(" ");
}

function requireDateOnly(value, fieldName) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`El campo ${fieldName} debe tener formato YYYY-MM-DD.`);
  }

  return value;
}

/**
 * Lista colaboradores elegibles para aguinaldo, aplicando las mismas reglas
 * base de Planillas (estado ACTIVO y contrato mas reciente hasta periodo_hasta).
 *
 * @param {{ periodo_desde: string, periodo_hasta: string }} params
 */
export async function listarColaboradoresElegiblesAguinaldo({
  periodo_desde,
  periodo_hasta,
}) {
  const periodoDesde = requireDateOnly(periodo_desde, "periodo_desde");
  const periodoHasta = requireDateOnly(periodo_hasta, "periodo_hasta");

  if (periodoDesde >= periodoHasta) {
    throw new Error("La fecha de inicio del periodo debe ser anterior a la fecha de fin.");
  }

  const anioAguinaldo = new Date(`${periodoHasta}T00:00:00`).getFullYear();
  if (!Number.isInteger(anioAguinaldo) || anioAguinaldo <= 0) {
    throw new Error("No se pudo determinar el anio del aguinaldo a partir de periodo_hasta.");
  }

  const estadoActivo = await ensureEstado("ACTIVO");

  const contratos = await Contrato.findAll({
    attributes: ["id_contrato", "id_colaborador", "fecha_inicio"],
    where: {
      estado: estadoActivo.id_estado,
      fecha_inicio: { [Op.lte]: periodoHasta },
    },
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        required: true,
        attributes: [
          "id_colaborador",
          "nombre",
          "primer_apellido",
          "segundo_apellido",
          "identificacion",
        ],
        where: { estado: estadoActivo.id_estado },
      },
    ],
    order: [
      ["id_colaborador", "ASC"],
      ["fecha_inicio", "DESC"],
      ["id_contrato", "DESC"],
    ],
  });

  const latestContratoByColaborador = new Map();

  for (const contrato of contratos) {
    const collaboratorId = Number(contrato.id_colaborador);
    if (!latestContratoByColaborador.has(collaboratorId)) {
      latestContratoByColaborador.set(collaboratorId, contrato);
    }
  }

  const collaboratorIds = Array.from(latestContratoByColaborador.keys());

  const aguinaldosExistentes = collaboratorIds.length
    ? await Aguinaldo.findAll({
      attributes: ["id_colaborador", "id_aguinaldo"],
      where: {
        id_colaborador: collaboratorIds,
        anio: anioAguinaldo,
      },
      raw: true,
    })
    : [];

  const existingByColaborador = new Set(
    aguinaldosExistentes.map((row) => Number(row.id_colaborador)),
  );

  const colaboradores = Array.from(latestContratoByColaborador.values()).map(
    (contrato) => ({
      id_colaborador: Number(contrato.id_colaborador),
      id_contrato: Number(contrato.id_contrato),
      nombre_completo: buildNombreCompleto(contrato.colaborador),
      identificacion: contrato.colaborador?.identificacion ?? null,
      fecha_inicio_contrato: contrato.fecha_inicio,
      tiene_aguinaldo: existingByColaborador.has(Number(contrato.id_colaborador)),
    }),
  );

  const totalGenerados = colaboradores.filter(
    (colaborador) => colaborador.tiene_aguinaldo,
  ).length;

  return {
    periodo_desde: periodoDesde,
    periodo_hasta: periodoHasta,
    anio: anioAguinaldo,
    colaboradores,
    total_elegibles: colaboradores.length,
    total_generados: totalGenerados,
    total_pendientes: colaboradores.length - totalGenerados,
  };
}
