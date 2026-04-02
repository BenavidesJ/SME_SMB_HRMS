import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import {
  Contrato,
  SaldoVacaciones,
} from "../../../../models/index.js";
import { computeDiasGanadosVacaciones } from "../../../../services/scheduleEngine/vacationsPolicy.js";
import { assertId, fetchEstadoId } from "./vacacionesUtils.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const COSTA_RICA_TZ = "America/Costa_Rica";

function buildLock(transaction, lockForUpdate) {
  if (!lockForUpdate || !transaction?.LOCK?.UPDATE) return undefined;
  return transaction.LOCK.UPDATE;
}

export async function syncSaldoVacacionesForColaborador({
  idColaborador,
  transaction,
  lockForUpdate = false,
  contratoActivo = null,
  estadoActivoId = null,
}) {
  const colaboradorId = assertId(idColaborador, "id_colaborador");
  const lock = buildLock(transaction, lockForUpdate);

  const resolvedEstadoActivoId = estadoActivoId
    ?? (await fetchEstadoId({ transaction, nombre: "ACTIVO" }));

  const activeContract = contratoActivo
    ?? (await Contrato.findOne({
      where: {
        id_colaborador: colaboradorId,
        estado: resolvedEstadoActivoId,
      },
      order: [["fecha_inicio", "DESC"], ["id_contrato", "DESC"]],
      transaction,
      lock,
    }));

  let saldo = await SaldoVacaciones.findOne({
    where: { id_colaborador: colaboradorId },
    transaction,
    lock,
  });

  const todayDate = dayjs().tz(COSTA_RICA_TZ).format("YYYY-MM-DD");
  const diasGanadosCalculados = activeContract
    ? Number(
        computeDiasGanadosVacaciones({
          contratoFechaInicio: String(activeContract.fecha_inicio),
          todayDate,
          tz: COSTA_RICA_TZ,
        }).dias_ganados,
      )
    : Number(saldo?.dias_ganados ?? 0);

  const diasGanadosPersist = Number(diasGanadosCalculados).toFixed(2);

  let created = false;
  let updated = false;

  if (!saldo) {
    saldo = await SaldoVacaciones.create(
      {
        id_colaborador: colaboradorId,
        dias_ganados: diasGanadosPersist,
        dias_tomados: "0.00",
      },
      { transaction },
    );
    created = true;
  } else if (Number(saldo.dias_ganados) !== diasGanadosCalculados) {
    await saldo.update({ dias_ganados: diasGanadosPersist }, { transaction });
    updated = true;
  }

  const diasGanados = Number(saldo.dias_ganados);
  const diasTomados = Number(saldo.dias_tomados);

  return {
    saldo,
    created,
    updated,
    contratoActivo: activeContract,
    diasGanados,
    diasTomados,
    diasDisponibles: Math.max(diasGanados - diasTomados, 0),
  };
}

export async function syncSaldosVacacionesOnStartup() {
  const estadoActivoId = await fetchEstadoId({ nombre: "ACTIVO" });

  const contratosActivos = await Contrato.findAll({
    where: { estado: estadoActivoId },
    attributes: ["id_colaborador"],
    group: ["id_colaborador"],
    order: [["id_colaborador", "ASC"]],
  });

  let procesados = 0;
  let creados = 0;
  let actualizados = 0;
  let errores = 0;

  for (const contrato of contratosActivos) {
    try {
      const result = await syncSaldoVacacionesForColaborador({
        idColaborador: Number(contrato.id_colaborador),
        estadoActivoId,
      });
      procesados += 1;
      if (result.created) creados += 1;
      if (result.updated) actualizados += 1;
    } catch (error) {
      errores += 1;
      console.error(
        `[vac-sync] Error sincronizando colaborador ${contrato.id_colaborador}:`,
        error,
      );
    }
  }

  return { procesados, creados, actualizados, errores };
}