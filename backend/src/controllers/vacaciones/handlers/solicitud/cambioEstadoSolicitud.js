import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import {
  sequelize,
  SolicitudVacaciones,
  SaldoVacaciones,
  Estado,
  Contrato,
  HorarioLaboral,
  Feriado,
  Incapacidad,
  SolicitudPermisosLicencias,
} from "../../../../models/index.js";

import { validateVacationRequestAndCompute } from "../../../../services/scheduleEngine/vacationService.js";

dayjs.extend(utc);
dayjs.extend(timezone);

async function resolveEstadoIdByName({ nombre, transaction }) {
  const estado = await Estado.findOne({
    where: sequelize.where(
      sequelize.fn("UPPER", sequelize.col("estado")),
      String(nombre).trim().toUpperCase()
    ),
    attributes: ["id_estado", "estado"],
    transaction,
  });

  if (!estado) throw new Error(`No existe el estado "${nombre}" en el catálogo estado`);
  return Number(estado.id_estado);
}

async function resolveEstadoNameById({ id_estado, transaction }) {
  const estado = await Estado.findByPk(Number(id_estado), {
    attributes: ["id_estado", "estado"],
    transaction,
  });
  return estado ? String(estado.estado).toUpperCase() : null;
}

/**
 * PATCH Vacaciones: cambia estado.
 */
export const cambiarEstadoSolicitudVacaciones = async ({
  id_solicitud_vacaciones,
  nuevo_estado, // "APROBADO"|"RECHAZADO"|"CANCELADO"
}) => {
  const tx = await sequelize.transaction();
  try {
    if (!Number.isFinite(Number(id_solicitud_vacaciones))) throw new Error("id_solicitud_vacaciones inválido");
    const target = String(nuevo_estado || "").trim().toUpperCase();
    if (!["APROBADO", "RECHAZADO", "CANCELADO"].includes(target)) {
      throw new Error('nuevo_estado debe ser "APROBADO", "RECHAZADO" o "CANCELADO"');
    }

    const row = await SolicitudVacaciones.findByPk(Number(id_solicitud_vacaciones), { transaction: tx });
    if (!row) throw new Error("No existe la solicitud de vacaciones");

    const estadoActualNombre = await resolveEstadoNameById({ id_estado: row.estado_solicitud, transaction: tx });
    if (estadoActualNombre !== "PENDIENTE") {
      throw new Error(`Solo se puede cambiar estado desde PENDIENTE. Actual=${estadoActualNombre || "N/A"}`);
    }

    const ESTADO_PENDIENTE_ID = await resolveEstadoIdByName({ nombre: "PENDIENTE", transaction: tx });
    const ESTADO_APROBADO_ID = await resolveEstadoIdByName({ nombre: "APROBADO", transaction: tx });
    const ESTADO_RECHAZADO_ID = await resolveEstadoIdByName({ nombre: "RECHAZADO", transaction: tx });
    const ESTADO_CANCELADO_ID = await resolveEstadoIdByName({ nombre: "CANCELADO", transaction: tx });
    const ESTADO_ACTIVO_ID = await resolveEstadoIdByName({ nombre: "ACTIVO", transaction: tx });

    const nextEstadoId =
      target === "APROBADO"
        ? ESTADO_APROBADO_ID
        : target === "RECHAZADO"
        ? ESTADO_RECHAZADO_ID
        : ESTADO_CANCELADO_ID;

    // Cambia estado
    if (target !== "APROBADO") {
      await row.update({ estado_solicitud: Number(nextEstadoId) }, { transaction: tx });
      await tx.commit();
      return row;
    }

    // Recalcular saldo, validar nuevamente, y descontar
    const saldo = await SaldoVacaciones.findByPk(Number(row.id_saldo_vacaciones), { transaction: tx });
    if (!saldo) throw new Error("No existe saldo_vacaciones asociado a la solicitud");

    const computed = await validateVacationRequestAndCompute({
      idColaborador: Number(row.id_colaborador),
      startDate: String(row.fecha_inicio),
      endDate: String(row.fecha_fin),
      models: {
        Contrato,
        HorarioLaboral,
        Feriado,
        Incapacidad,
        SolicitudPermisosLicencias,
        SolicitudVacaciones,
        Estado,
      },
      config: {
        contratoActivoIds: [ESTADO_ACTIVO_ID],
        horarioActivoIds: [ESTADO_ACTIVO_ID],
      },
      estadoIds: {
        PENDIENTE: ESTADO_PENDIENTE_ID,
        APROBADO: ESTADO_APROBADO_ID,
      },
      saldoVacaciones: saldo,
      transaction: tx,
    });

    if (!computed.allowed) {
      throw new Error(
        computed.reason === "INSUFFICIENT_BALANCE"
          ? `SALDO_INSUFICIENTE: disponibles=${computed.available}, requerido=${computed.required}`
          : "VACACIONES_INVALIDAS"
      );
    }

    // Recalcular ganados y descuenta tomados
    const diasGanadosNext = Number(computed.earned.dias_ganados);
    const diasTomadosNext = Number(saldo.dias_tomados || 0) + Number(computed.charge.chargeableDays);

    await saldo.update(
      { dias_ganados: diasGanadosNext, dias_tomados: diasTomadosNext },
      { transaction: tx }
    );

    await row.update({ estado_solicitud: Number(nextEstadoId) }, { transaction: tx });

    await tx.commit();

    return {
      ...row.toJSON(),
      meta_engine: {
        chargeableDays: computed.charge.chargeableDays,
        dias_ganados_recalculados: diasGanadosNext,
        dias_tomados_actualizados: diasTomadosNext,
      },
    };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
