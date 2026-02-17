import {
  Liquidacion,
  SaldoVacaciones,
  CausaLiquidacion,
} from "../../../models/index.js";
import { runInTransaction } from "../../mantenimientos_consultas/shared/transaction.js";

/**
 * Crea la liquidación en la BD tras confirmación del usuario
 * @param {number} idColaborador
 * @param {object} datosLiquidacion - Simulación confirmada (puede incluir ajustes)
 * @param {number} idAprobador
 * @param {import("sequelize").Transaction} [transaction]
 * @returns {Promise<object>}
 */
export async function crearLiquidacion(
  idColaborador,
  datosLiquidacion,
  idAprobador,
  transaction
) {
  return runInTransaction(async (tx) => {
    const { causa, fechaTerminacion, componentes, totales, realizoPreaviso } =
      datosLiquidacion;

    // Validar que la causa existe
    const causaLiq = await CausaLiquidacion.findOne(
      { where: { causa_liquidacion: causa } },
      { transaction: tx }
    );

    if (!causaLiq) {
      const error = new Error(`Causa de liquidación inválida: ${causa}`);
      error.statusCode = 400;
      throw error;
    }

    // Validar que no existe liquidación duplicada para el mismo colaborador y fecha
    const existente = await Liquidacion.findOne(
      {
        where: {
          id_colaborador: idColaborador,
          fecha_terminacion: fechaTerminacion,
        },
      },
      { transaction: tx }
    );

    if (existente) {
      const error = new Error(
        "Ya existe una liquidación para este colaborador en esta fecha"
      );
      error.statusCode = 409;
      throw error;
    }

    // Obtener o crear saldo de vacaciones
    let saldoVacacionesId = null;
    const saldoVacaciones = await SaldoVacaciones.findOne(
      { where: { id_colaborador: idColaborador } },
      { transaction: tx }
    );

    if (saldoVacaciones) {
      saldoVacacionesId = saldoVacaciones.id_saldo_vac;
      // Actualizar saldo si se usan vacaciones
      if (componentes.vacacionesProporcionales.valor > 0) {
        await saldoVacaciones.update(
          {
            dias_tomados:
              Number(saldoVacaciones.dias_tomados) +
              componentes.vacacionesProporcionales.diasPendientes,
          },
          { transaction: tx }
        );
      }
    }

    // Crear registro de liquidación
    const liquidacion = await Liquidacion.create(
      {
        id_colaborador: idColaborador,
        causa: causaLiq.id_causa_liquidacion,
        realizo_preaviso: realizoPreaviso || false,
        fecha_terminacion: fechaTerminacion,
        promedio_base: componentes.salarioDiario.valor,
        aguinaldo_proporcional: componentes.aguinaldoProporcional.valor,
        monto_cesantia: componentes.cesantia.valor,
        monto_preaviso: componentes.preaviso.valor,
        otros_montos: 0, // Puede ampliarse en el futuro
        id_aprobador: idAprobador,
        fecha_aprobacion: new Date().toISOString().split("T")[0],
        saldo_vacaciones: saldoVacacionesId,
      },
      { transaction: tx }
    );

    return {
      success: true,
      id_caso_termina: liquidacion.id_caso_termina,
      idColaborador,
      fechaTerminacion,
      causa,
      totales,
      mensaje: "Liquidación creada exitosamente",
    };
  });
}
