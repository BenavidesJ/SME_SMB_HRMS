import {
  Evaluacion,
  EvaluacionRubro,
  Colaborador,
  RubroEvaluacion,
  sequelize,
} from "../../../models/index.js";

/**
 * Crea una evaluación vacía para un colaborador con rubros asignados.
 * @param {{
 *   id_colaborador: number,
 *   id_evaluador: number,
 *   fecha_inicio: string,
 *   fecha_fin: string,
 *   rubros_ids: number[]
 * }} data
 * @returns {Promise<object>} Evaluación creada con rubros asignados
 */
export async function crearEvaluacion({
  id_colaborador,
  id_evaluador,
  fecha_inicio,
  fecha_fin,
  rubros_ids,
}) {
  if (!id_colaborador) throw new Error("id_colaborador es obligatorio");
  if (!id_evaluador) throw new Error("id_evaluador es obligatorio");
  if (!fecha_inicio) throw new Error("fecha_inicio es obligatoria");
  if (!fecha_fin) throw new Error("fecha_fin es obligatoria");
  if (!rubros_ids || !Array.isArray(rubros_ids) || rubros_ids.length === 0) {
    throw new Error("Debe seleccionar al menos un rubro para la evaluación");
  }

  // Verificar que los colaboradores existan
  const colaborador = await Colaborador.findByPk(id_colaborador);
  if (!colaborador) throw new Error("El colaborador a evaluar no existe");

  const evaluador = await Colaborador.findByPk(id_evaluador);
  if (!evaluador) throw new Error("El evaluador no existe");

  if (Number(id_colaborador) === Number(id_evaluador)) {
    throw new Error("El evaluador no puede evaluarse a sí mismo");
  }

  // Verificar que todos los rubros existen
  const rubrosExistentes = await RubroEvaluacion.findAll({
    where: { id_rubro_evaluacion: rubros_ids },
  });

  if (rubrosExistentes.length !== rubros_ids.length) {
    throw new Error("Uno o más rubros seleccionados no existen");
  }

  const tx = await sequelize.transaction();

  try {
    // Crear la evaluación vacía
    const evaluacion = await Evaluacion.create(
      {
        id_colaborador,
        id_evaluador,
        puntaje_general: 0,
        plan_accion: "",
        finalizada: false,
        fecha_inicio,
        fecha_fin,
      },
      { transaction: tx }
    );

    // Crear las relaciones evaluacion_rubro
    const evaluacionRubros = rubros_ids.map((id_rubro) => ({
      id_evaluacion: evaluacion.id_evaluacion,
      id_rubro_evaluacion: id_rubro,
    }));

    await EvaluacionRubro.bulkCreate(evaluacionRubros, { transaction: tx });

    await tx.commit();

    // Retornar la evaluación con sus rubros
    const evaluacionCompleta = await Evaluacion.findByPk(
      evaluacion.id_evaluacion,
      {
        include: [
          { association: "colaborador", attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"] },
          { association: "evaluador", attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"] },
          {
            association: "rubros",
            include: [{ association: "rubro" }],
          },
        ],
      }
    );

    return evaluacionCompleta;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
