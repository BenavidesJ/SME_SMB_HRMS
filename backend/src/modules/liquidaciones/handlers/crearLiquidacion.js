import {
  Liquidacion,
  SaldoVacaciones,
  CausaLiquidacion,
} from "../../../models/index.js";
import { fn, col, where } from "sequelize";
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
    const redondearMoneda = (monto) => Math.round((Number(monto || 0) + Number.EPSILON) * 100) / 100;
    const { causa, causaId, fechaTerminacion, componentes, totales, realizoPreaviso } =
      datosLiquidacion;

    // Validar que la causa existe
    const causaLiq = causaId
      ? await CausaLiquidacion.findByPk(causaId, { transaction: tx })
      : await CausaLiquidacion.findOne({
          where: where(
            fn("LOWER", col("causa_liquidacion")),
            String(causa ?? "").trim().toLowerCase()
          ),
          transaction: tx,
        });

    if (!causaLiq) {
      const error = new Error(`Causa de liquidación inválida: ${causa}`);
      error.statusCode = 400;
      throw error;
    }

    // Validar que no existe liquidación duplicada para el mismo colaborador y fecha
    const existente = await Liquidacion.findOne({
      where: {
        id_colaborador: idColaborador,
        fecha_terminacion: fechaTerminacion,
      },
      transaction: tx,
    });

    if (existente) {
      const error = new Error(
        "Ya existe una liquidación para este colaborador en esta fecha"
      );
      error.statusCode = 409;
      throw error;
    }

    // Obtener o crear saldo de vacaciones
    const [saldoVacaciones] = await SaldoVacaciones.findOrCreate({
      where: { id_colaborador: idColaborador },
      defaults: {
        id_colaborador: idColaborador,
        dias_ganados: "0.00",
        dias_tomados: "0.00",
      },
      transaction: tx,
    });

    const saldoVacacionesId = saldoVacaciones.id_saldo_vac;

    // Actualizar saldo si se usan vacaciones
    if (Number(componentes?.vacacionesProporcionales?.valor || 0) > 0) {
      await saldoVacaciones.update(
        {
          dias_tomados:
            Number(saldoVacaciones.dias_tomados) +
            Number(componentes.vacacionesProporcionales.diasPendientes || 0),
        },
        { transaction: tx }
      );
    }

    const montoVacaciones = redondearMoneda(componentes?.vacacionesProporcionales?.valor);
    const montoSalarioPendiente = redondearMoneda(componentes?.salarioPendiente?.valor);
    const otrosMontos = redondearMoneda(montoVacaciones + montoSalarioPendiente);

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
        // Incluye montos no modelados por columna: vacaciones + salario pendiente.
        otros_montos: otrosMontos,
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
