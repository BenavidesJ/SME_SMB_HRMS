import { models } from "../../../models/index.js";

/**
 * Obtiene una evaluación por su ID con todos sus rubros y datos relacionados.
 * @param {{ id_evaluacion: number }} data
 * @returns {Promise<object>} Evaluación completa
 */
export async function obtenerEvaluacionPorId({ id_evaluacion }) {
  if (!id_evaluacion) {
    throw new Error("El identificador de la evaluación es obligatorio");
  }

  const evaluacion = await models.Evaluacion.findByPk(id_evaluacion, {
    include: [
      {
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
      },
      {
        association: "evaluador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
      },
      {
        association: "rubros",
        include: [{ association: "rubro" }],
      },
    ],
  });

  if (!evaluacion) {
    throw new Error("La evaluación no existe");
  }

  return evaluacion;
}
