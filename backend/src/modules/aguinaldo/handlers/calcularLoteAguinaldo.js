import { Colaborador } from "../../../models/index.js";
import { calcularMontoPorColaborador } from "../utils/aguinaldoCalculator.js";

/**
 * Simula el cálculo de aguinaldo para un lote de colaboradores.
 * No persiste nada en BD — solo devuelve el preview con montos calculados.
 *
 * @param {{ colaboradores: number[], periodo_desde: string, periodo_hasta: string }} params
 * @returns {Promise<{ periodo_desde: string, periodo_hasta: string, resultados: object[] }>}
 */
export async function calcularLoteAguinaldo({
  colaboradores,
  periodo_desde,
  periodo_hasta,
}) {
  if (!Array.isArray(colaboradores) || colaboradores.length === 0) {
    throw new Error("Debe proporcionar al menos un colaborador.");
  }
  if (!periodo_desde || !periodo_hasta) {
    throw new Error("Debe proporcionar las fechas del periodo (periodo_desde, periodo_hasta).");
  }
  if (periodo_desde >= periodo_hasta) {
    throw new Error("La fecha de inicio del periodo debe ser anterior a la fecha de fin.");
  }

  // Obtener nombres de los colaboradores para el preview
  const empleados = await Colaborador.findAll({
    attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido", "identificacion"],
    where: { id_colaborador: colaboradores },
    raw: true,
  });

  const empleadosMap = new Map(
    empleados.map((e) => [e.id_colaborador, e]),
  );

  const resultados = [];

  for (const idCol of colaboradores) {
    const empleado = empleadosMap.get(idCol);

    if (!empleado) {
      resultados.push({
        id_colaborador: idCol,
        nombre_completo: "Colaborador no encontrado",
        identificacion: null,
        desglose: [],
        total_bruto: 0,
        monto_aguinaldo: 0,
        error: "Colaborador no existe en el sistema.",
      });
      continue;
    }

    try {
      const { desglose, totalBruto, montoAguinaldo } =
        await calcularMontoPorColaborador(idCol, periodo_desde, periodo_hasta);

      const nombreCompleto = [
        empleado.nombre,
        empleado.primer_apellido,
        empleado.segundo_apellido,
      ]
        .filter(Boolean)
        .join(" ");

      resultados.push({
        id_colaborador: idCol,
        nombre_completo: nombreCompleto,
        identificacion: empleado.identificacion,
        desglose,
        total_bruto: totalBruto,
        monto_aguinaldo: montoAguinaldo,
        error: null,
      });
    } catch (err) {
      resultados.push({
        id_colaborador: idCol,
        nombre_completo: [empleado.nombre, empleado.primer_apellido, empleado.segundo_apellido]
          .filter(Boolean)
          .join(" "),
        identificacion: empleado.identificacion,
        desglose: [],
        total_bruto: 0,
        monto_aguinaldo: 0,
        error: err.message,
      });
    }
  }

  return {
    periodo_desde,
    periodo_hasta,
    total_colaboradores: resultados.length,
    resultados,
  };
}
