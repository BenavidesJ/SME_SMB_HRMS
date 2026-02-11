import {
  Evaluacion,
  EvaluacionRubro,
  RubroEvaluacion,
  sequelize,
} from "../../../models/index.js";

/**
 * Finaliza una evaluación: actualiza calificaciones de rubros, calcula puntaje general,
 * guarda plan de acción y marca como finalizada.
 * @param {{
 *   id_evaluacion: number,
 *   calificaciones: Array<{ id_rubro_evaluacion: number, calificacion: number, comentarios?: string }>,
 *   plan_accion: string
 * }} data
 * @returns {Promise<object>} Evaluación finalizada
 */
export async function finalizarEvaluacion({ id_evaluacion, calificaciones, plan_accion }) {
  if (!id_evaluacion) throw new Error("El identificador de la evaluación es obligatorio");
  if (!calificaciones || !Array.isArray(calificaciones) || calificaciones.length === 0) {
    throw new Error("Debe proporcionar las calificaciones de los rubros");
  }

  const evaluacion = await Evaluacion.findByPk(id_evaluacion);
  if (!evaluacion) throw new Error("La evaluación no existe");
  if (evaluacion.finalizada) throw new Error("La evaluación ya fue finalizada");

  // Verificar que los rubros pertenecen a esta evaluación
  const rubrosAsignados = await EvaluacionRubro.findAll({
    where: { id_evaluacion },
  });

  const idsAsignados = rubrosAsignados.map((r) => r.id_rubro_evaluacion);
  const idsCalificados = calificaciones.map((c) => c.id_rubro_evaluacion);

  const todosPresentes = idsAsignados.every((id) => idsCalificados.includes(id));
  if (!todosPresentes) {
    throw new Error("Debe calificar todos los rubros asignados a esta evaluación");
  }

  const tx = await sequelize.transaction();

  try {
    // Actualizar cada rubro con su calificación y comentarios
    for (const cal of calificaciones) {
      await RubroEvaluacion.update(
        {
          calificacion: Number(cal.calificacion),
          comentarios: cal.comentarios ? String(cal.comentarios).trim() : "",
        },
        {
          where: { id_rubro_evaluacion: cal.id_rubro_evaluacion },
          transaction: tx,
        }
      );
    }

    // Calcular puntaje general (promedio de calificaciones)
    const sumaCalificaciones = calificaciones.reduce(
      (sum, c) => sum + Number(c.calificacion),
      0
    );
    const puntajeGeneral = sumaCalificaciones / calificaciones.length;

    // Actualizar la evaluación
    await evaluacion.update(
      {
        puntaje_general: Math.round(puntajeGeneral * 100) / 100,
        plan_accion: plan_accion ? String(plan_accion).trim() : "",
        finalizada: true,
      },
      { transaction: tx }
    );

    await tx.commit();

    // Retornar la evaluación actualizada
    const evaluacionFinalizada = await Evaluacion.findByPk(id_evaluacion, {
      include: [
        { association: "colaborador", attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"] },
        { association: "evaluador", attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"] },
        {
          association: "rubros",
          include: [{ association: "rubro" }],
        },
      ],
    });

    return evaluacionFinalizada;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
