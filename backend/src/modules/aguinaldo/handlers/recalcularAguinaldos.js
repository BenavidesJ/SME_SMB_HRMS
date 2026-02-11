import { Aguinaldo, Colaborador } from "../../../models/index.js";
import { calcularMontoPorColaborador } from "../utils/aguinaldoCalculator.js";

/**
 * Recalcula el monto de aguinaldo para registros existentes.
 * Recibe un array de id_aguinaldo, retoma el período original de cada registro,
 * recalcula desde Planilla y actualiza monto_calculado (sin histórico).
 *
 * @param {{ ids: number[] }} params
 * @returns {Promise<{ recalculados: object[] }>}
 */
export async function recalcularAguinaldos({ ids }) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("Debe proporcionar al menos un id de aguinaldo para recalcular.");
  }

  const registros = await Aguinaldo.findAll({
    where: { id_aguinaldo: ids },
    include: [
      {
        model: Colaborador,
        as: "colaborador",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
      },
    ],
  });

  if (registros.length === 0) {
    throw new Error("No se encontraron registros de aguinaldo con los IDs proporcionados.");
  }

  const recalculados = [];

  for (const registro of registros) {
    const montoAnterior = Number(registro.monto_calculado);

    const { montoAguinaldo } = await calcularMontoPorColaborador(
      registro.id_colaborador,
      registro.periodo_desde,
      registro.periodo_hasta,
    );

    await registro.update({ monto_calculado: montoAguinaldo });

    const colaborador = registro.colaborador;
    const nombreCompleto = colaborador
      ? [colaborador.nombre, colaborador.primer_apellido, colaborador.segundo_apellido]
          .filter(Boolean)
          .join(" ")
      : `Colaborador #${registro.id_colaborador}`;

    recalculados.push({
      id_aguinaldo: registro.id_aguinaldo,
      id_colaborador: registro.id_colaborador,
      nombre_completo: nombreCompleto,
      monto_anterior: montoAnterior,
      monto_nuevo: montoAguinaldo,
      diferencia: Math.round((montoAguinaldo - montoAnterior) * 100) / 100,
    });
  }

  return {
    total_recalculados: recalculados.length,
    recalculados,
  };
}
