import { models } from "../../../models/index.js";

/**
 * Obtiene todas las evaluaciones con filtros opcionales.
 * @param {{ id_evaluador?: number, finalizada?: boolean, departamento?: number }} filtros
 * @returns {Promise<object[]>} Lista de evaluaciones
 */
export async function obtenerEvaluaciones({ id_evaluador, finalizada, departamento } = {}) {
  const where = {};

  if (id_evaluador !== undefined && id_evaluador !== null) {
    where.id_evaluador = Number(id_evaluador);
  }

  if (finalizada !== undefined && finalizada !== null) {
    where.finalizada = finalizada === "true" || finalizada === true;
  }

  // Construir include para el colaborador evaluado con su contrato → puesto → departamento
  const colaboradorInclude = {
    association: "colaborador",
    attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
    include: [
      {
        model: models.Contrato,
        as: "contratos",
        attributes: ["id_contrato", "id_puesto"],
        where: { estado: 1 },
        required: false,
        limit: 1,
        order: [["fecha_inicio", "DESC"]],
        include: [
          {
            model: models.Puesto,
            as: "puesto",
            attributes: ["id_puesto", "nombre", "id_departamento"],
            include: [
              {
                model: models.Departamento,
                as: "departamento",
                attributes: ["id_departamento", "nombre"],
              },
            ],
          },
        ],
      },
    ],
  };

  const evaluaciones = await models.Evaluacion.findAll({
    where,
    include: [
      colaboradorInclude,
      {
        association: "evaluador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
      },
      {
        association: "rubros",
        include: [{ association: "rubro" }],
      },
    ],
    order: [["fecha_fin", "DESC"]],
  });

  // Filtrar por departamento si se especificó
  if (departamento !== undefined && departamento !== null) {
    const deptId = Number(departamento);
    return evaluaciones.filter((ev) => {
      const contrato = ev.colaborador?.contratos?.[0];
      return contrato?.puesto?.departamento?.id_departamento === deptId;
    });
  }

  return evaluaciones;
}
