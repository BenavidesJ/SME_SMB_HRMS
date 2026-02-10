import { RubroEvaluacion, EvaluacionRubro } from "../../../models/index.js";

/**
 * Elimina un rubro de evaluación si no está siendo utilizado.
 * @param {{ id_rubro_evaluacion: number }} data
 * @returns {Promise<object>} Resultado de la eliminación
 */
export async function eliminarRubro({ id_rubro_evaluacion }) {
  if (!id_rubro_evaluacion) {
    throw new Error("El identificador del rubro es obligatorio");
  }

  const rubro = await RubroEvaluacion.findByPk(id_rubro_evaluacion);
  if (!rubro) {
    throw new Error("El rubro no existe");
  }

  // Verificar que no esté asignado a ninguna evaluación
  const asignaciones = await EvaluacionRubro.count({
    where: { id_rubro_evaluacion },
  });

  if (asignaciones > 0) {
    throw new Error("No se puede eliminar el rubro porque está asignado a evaluaciones existentes");
  }

  await rubro.destroy();

  return { eliminado: true };
}
