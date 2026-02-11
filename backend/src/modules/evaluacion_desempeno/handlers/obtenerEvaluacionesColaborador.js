import { models } from "../../../models/index.js";

/**
 * Obtiene las evaluaciones finalizadas de un colaborador (para su perfil).
 * @param {{ id_colaborador: number }} data
 * @returns {Promise<object[]>} Lista de evaluaciones finalizadas del colaborador
 */
export async function obtenerEvaluacionesColaborador({ id_colaborador }) {
  if (!id_colaborador) {
    throw new Error("El identificador del colaborador es obligatorio");
  }

  const evaluaciones = await models.Evaluacion.findAll({
    where: {
      id_colaborador: Number(id_colaborador),
      finalizada: true,
    },
    include: [
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

  return evaluaciones;
}
