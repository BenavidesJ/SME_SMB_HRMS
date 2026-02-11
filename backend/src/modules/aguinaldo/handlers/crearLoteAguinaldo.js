import { sequelize, Aguinaldo, Colaborador } from "../../../models/index.js";
import {
  calcularMontoPorColaborador,
  buscarAguinaldoExistente,
} from "../utils/aguinaldoCalculator.js";

/**
 * Crea registros de aguinaldo para un lote de colaboradores.
 * Valida que no exista ya un aguinaldo para el mismo colaborador-año (error 409).
 *
 * @param {{ colaboradores: number[], periodo_desde: string, periodo_hasta: string, anio: number, fecha_pago: string, registrado_por: number }} params
 * @returns {Promise<{ creados: object[], duplicados: object[] }>}
 */
export async function crearLoteAguinaldo({
  colaboradores,
  periodo_desde,
  periodo_hasta,
  anio,
  fecha_pago,
  registrado_por,
}) {
  if (!Array.isArray(colaboradores) || colaboradores.length === 0) {
    throw new Error("Debe proporcionar al menos un colaborador.");
  }
  if (!periodo_desde || !periodo_hasta) {
    throw new Error("Debe proporcionar las fechas del periodo (periodo_desde, periodo_hasta).");
  }
  if (!anio) {
    throw new Error("Debe proporcionar el año del aguinaldo.");
  }
  if (!fecha_pago) {
    throw new Error("Debe proporcionar la fecha de pago.");
  }
  if (!registrado_por) {
    throw new Error("Debe proporcionar el usuario que registra el aguinaldo.");
  }

  // Obtener nombres para el reporte
  const empleados = await Colaborador.findAll({
    attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
    where: { id_colaborador: colaboradores },
    raw: true,
  });
  const empleadosMap = new Map(empleados.map((e) => [e.id_colaborador, e]));

  const creados = [];
  const duplicados = [];

  const transaction = await sequelize.transaction();

  try {
    for (const idCol of colaboradores) {
      // Verificar si ya existe
      const existente = await buscarAguinaldoExistente(idCol, anio, transaction);

      const empleado = empleadosMap.get(idCol);
      const nombreCompleto = empleado
        ? [empleado.nombre, empleado.primer_apellido, empleado.segundo_apellido]
            .filter(Boolean)
            .join(" ")
        : `Colaborador #${idCol}`;

      if (existente) {
        duplicados.push({
          id_colaborador: idCol,
          nombre_completo: nombreCompleto,
          id_aguinaldo: existente.id_aguinaldo,
          monto_existente: Number(existente.monto_calculado),
        });
        continue;
      }

      // Calcular monto
      const { montoAguinaldo } = await calcularMontoPorColaborador(
        idCol,
        periodo_desde,
        periodo_hasta,
        transaction,
      );

      // Crear registro
      const nuevoAguinaldo = await Aguinaldo.create(
        {
          id_colaborador: idCol,
          anio,
          periodo_desde,
          periodo_hasta,
          monto_calculado: montoAguinaldo,
          fecha_pago,
          registrado_por,
        },
        { transaction },
      );

      creados.push({
        id_aguinaldo: nuevoAguinaldo.id_aguinaldo,
        id_colaborador: idCol,
        nombre_completo: nombreCompleto,
        monto_calculado: montoAguinaldo,
      });
    }

    // Si TODOS son duplicados, lanzar error 409
    if (creados.length === 0 && duplicados.length > 0) {
      await transaction.rollback();
      const err = new Error(
        "Todos los colaboradores seleccionados ya tienen un aguinaldo registrado para este año. Utilice la opción de recalcular.",
      );
      err.statusCode = 409;
      err.data = { duplicados };
      throw err;
    }

    await transaction.commit();

    return {
      creados,
      duplicados,
      mensaje:
        duplicados.length > 0
          ? `Se crearon ${creados.length} aguinaldos. ${duplicados.length} colaborador(es) ya tenían registro para el año ${anio}.`
          : `Se crearon ${creados.length} aguinaldos exitosamente.`,
    };
  } catch (error) {
    if (!error.statusCode) {
      await transaction.rollback();
    }
    throw error;
  }
}
