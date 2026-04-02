import { Op } from "sequelize";
import { Aguinaldo, sequelize } from "../../../models/index.js";
import { parseAguinaldoPeriodoKey } from "../utils/periodoKey.js";

export async function eliminarPeriodoAguinaldo({ periodoKey } = {}) {
  const parsedPeriodo = parseAguinaldoPeriodoKey(periodoKey);

  return sequelize.transaction(async (transaction) => {
    const records = await Aguinaldo.findAll({
      attributes: ["id_aguinaldo", "monto_calculado"],
      where: {
        anio: parsedPeriodo.anio,
        periodo_desde: parsedPeriodo.periodo_desde,
        periodo_hasta: parsedPeriodo.periodo_hasta,
        fecha_pago: parsedPeriodo.fecha_pago,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
      raw: true,
    });

    if (records.length === 0) {
      throw new Error("No existe el periodo de aguinaldo seleccionado");
    }

    const recordIds = records.map((record) => Number(record.id_aguinaldo));
    const montoTotal = records.reduce(
      (acc, record) => acc + Number(record.monto_calculado ?? 0),
      0,
    );

    await Aguinaldo.destroy({
      where: { id_aguinaldo: { [Op.in]: recordIds } },
      transaction,
    });

    return {
      periodo_key: periodoKey,
      anio: parsedPeriodo.anio,
      periodo_desde: parsedPeriodo.periodo_desde,
      periodo_hasta: parsedPeriodo.periodo_hasta,
      fecha_pago: parsedPeriodo.fecha_pago,
      eliminados: recordIds.length,
      monto_total: Math.round(montoTotal * 100) / 100,
    };
  });
}