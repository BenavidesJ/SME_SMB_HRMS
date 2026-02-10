import { RubroEvaluacion } from "../../../models/index.js";

/**
 * Obtiene todos los rubros de evaluación disponibles.
 * @returns {Promise<object[]>} Lista de rubros
 */
export async function obtenerRubros() {
  const rubros = await RubroEvaluacion.findAll({
    order: [["id_rubro_evaluacion", "ASC"]],
  });

  return rubros;
}
