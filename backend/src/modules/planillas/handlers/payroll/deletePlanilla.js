import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../../mantenimientos_consultas/shared/transaction.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";

const { Planilla, DeduccionPlanilla } = models;

/**
 * Elimina una planilla (detalle) y sus deducciones asociadas.
 *
 * @param {{ id_detalle: number }} payload
 * @returns {{ id_detalle: number }}
 */
export const eliminarPlanilla = (payload = {}) =>
  runInTransaction(async (transaction) => {
    const idDetalle = requirePositiveInt(payload.id_detalle, "id_detalle");

    const planilla = await Planilla.findByPk(idDetalle, { transaction });
    if (!planilla) {
      throw new Error(`No existe una planilla con id ${idDetalle}`);
    }

    // Eliminar deducciones asociadas primero (FK)
    await DeduccionPlanilla.destroy({
      where: { id_planilla: idDetalle },
      transaction,
    });

    // Eliminar la planilla
    await planilla.destroy({ transaction });

    return { id_detalle: idDetalle };
  });
