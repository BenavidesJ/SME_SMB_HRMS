import { Liquidacion } from "../../../models/index.js";
import { runInTransaction } from "../../mantenimientos_consultas/shared/transaction.js";

/**
 * Recalcula una liquidación existente si hay cambios
 * Solo permite recalcular si no ha sido aprobada
 * @param {number} idCasoTermina
 * @param {object} datosActualizados
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<object>}
 */
export async function recalcularLiquidacion(
  idCasoTermina,
  datosActualizados,
  transaction
) {
  return runInTransaction(async (tx) => {
    const liquidacion = await Liquidacion.findByPk(idCasoTermina, { transaction: tx });

    if (!liquidacion) {
      const error = new Error("Liquidación no encontrada");
      error.statusCode = 404;
      throw error;
    }

    // Validar que no esté aprobada (fecha_aprobacion está en el futuro o es null)
    const hoy = new Date().toISOString().split("T")[0];
    if (liquidacion.fecha_aprobacion && liquidacion.fecha_aprobacion < hoy) {
      const error = new Error(
        "No se puede recalcular una liquidación ya aprobada"
      );
      error.statusCode = 403;
      throw error;
    }

    // Actualizar campos calculables
    const actualizables = [
      "promedio_base",
      "aguinaldo_proporcional",
      "monto_cesantia",
      "monto_preaviso",
      "otros_montos",
    ];

    const actualizacion = {};

    for (const campo of actualizables) {
      if (datosActualizados[campo] !== undefined) {
        actualizacion[campo] = datosActualizados[campo];
      }
    }

    if (Object.keys(actualizacion).length === 0) {
      return {
        success: false,
        mensaje: "No hay cambios para actualizar",
      };
    }

    await liquidacion.update(actualizacion, { transaction: tx });

    return {
      success: true,
      id_caso_termina: idCasoTermina,
      cambiosActualizados: Object.keys(actualizacion),
      mensaje: "Liquidación recalculada exitosamente",
    };
  });
}
