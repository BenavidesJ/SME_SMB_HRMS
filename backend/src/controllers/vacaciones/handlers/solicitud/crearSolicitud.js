import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import {
  sequelize,
  SolicitudVacaciones,
  SaldoVacaciones,
  Estado,
  Colaborador,
  Contrato,
  HorarioLaboral,
  Feriado,
  Incapacidad,
  SolicitudPermisosLicencias,
} from "../../../../models/index.js";

import { validateVacationRequestAndCompute } from "../../../../services/scheduleEngine/vacationService.js";
import { computeDiasGanadosVacaciones } from "../../../../services/scheduleEngine/vacationsPolicy.js";

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

function assertDateOnlyStr(value, fieldName) {
  if (typeof value !== "string") throw new Error(`${fieldName} debe ser string YYYY-MM-DD`);
  const d = dayjs(value, "YYYY-MM-DD", true);
  if (!d.isValid()) throw new Error(`${fieldName} inválido (YYYY-MM-DD)`);
  return value;
}

async function getContratoActivo({ id_colaborador, ESTADO_ACTIVO_ID, transaction }) {
  const contrato = await Contrato.findOne({
    where: {
      id_colaborador: Number(id_colaborador),
      estado: Number(ESTADO_ACTIVO_ID),
    },
    order: [["fecha_inicio", "DESC"]],
    transaction,
  });

  if (!contrato) {
    throw new Error(`No hay contrato activo para id_colaborador=${id_colaborador}`);
  }

  return contrato;
}

/**
 * POST Vacaciones
 */
export const crearSolicitudVacaciones = async ({
  id_colaborador,
  id_aprobador,
  fecha_inicio,
  fecha_fin,
  id_saldo_vacaciones = null, // opcional
}) => {
  const tx = await sequelize.transaction();
  try {
    if (!Number.isFinite(Number(id_colaborador))) throw new Error("id_colaborador inválido");
    if (!Number.isFinite(Number(id_aprobador))) throw new Error("id_aprobador inválido");

    const startDate = assertDateOnlyStr(fecha_inicio, "fecha_inicio");
    const endDate = assertDateOnlyStr(fecha_fin, "fecha_fin");

    if (dayjs(endDate).isBefore(dayjs(startDate))) {
      throw new Error("fecha_fin no puede ser menor que fecha_inicio");
    }

    const ESTADO_ACTIVO_ID = await resolveEstadoIdByName({ nombre: "ACTIVO", transaction: tx });
    const ESTADO_PENDIENTE_ID = await resolveEstadoIdByName({ nombre: "PENDIENTE", transaction: tx });
    const ESTADO_APROBADO_ID = await resolveEstadoIdByName({ nombre: "APROBADO", transaction: tx });

    // Validar colaborador
    const colaborador = await Colaborador.findByPk(Number(id_colaborador), {
      attributes: ["id_colaborador", "id_saldo_vacaciones"],
      transaction: tx,
    });
    if (!colaborador) throw new Error("No existe el colaborador");

    // Resolver o crear saldo
    let idSaldo =
      Number(colaborador.id_saldo_vacaciones) ||
      (Number.isFinite(Number(id_saldo_vacaciones)) ? Number(id_saldo_vacaciones) : null);

    let saldo = null;

    if (idSaldo) {
      saldo = await SaldoVacaciones.findByPk(Number(idSaldo), { transaction: tx });
      if (!saldo) throw new Error("No existe el saldo_vacaciones indicado");
    } else {
      const contrato = await getContratoActivo({
        id_colaborador: Number(id_colaborador),
        ESTADO_ACTIVO_ID,
        transaction: tx,
      });

      const todayDate = dayjs().tz("America/Costa_Rica").format("YYYY-MM-DD");
      const earned = computeDiasGanadosVacaciones({
        contratoFechaInicio: String(contrato.fecha_inicio),
        todayDate,
        tz: "America/Costa_Rica",
      });

      saldo = await SaldoVacaciones.create(
        {
          dias_ganados: Number(earned.dias_ganados),
          dias_tomados: 0,
        },
        { transaction: tx }
      );

      idSaldo = Number(saldo.id_saldo_vac);

      await colaborador.update(
        { id_saldo_vacaciones: Number(idSaldo) },
        { transaction: tx }
      );
    }

    const computed = await validateVacationRequestAndCompute({
      idColaborador: Number(id_colaborador),
      startDate,
      endDate,
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

    await saldo.update(
      { dias_ganados: Number(computed.earned.dias_ganados) },
      { transaction: tx }
    );

    const row = await SolicitudVacaciones.create(
      {
        id_colaborador: Number(id_colaborador),
        id_aprobador: Number(id_aprobador),
        estado_solicitud: Number(ESTADO_PENDIENTE_ID),
        fecha_inicio: startDate,
        fecha_fin: endDate,
        id_saldo_vacaciones: Number(idSaldo),
      },
      { transaction: tx }
    );

    await tx.commit();

    return {
      ...row.toJSON(),
      meta_engine: {
        chargeableDays: computed.charge.chargeableDays,
        chargeableDates: computed.charge.chargeableDates,
        skippedDates: computed.charge.skippedDates,
        dias_ganados_recalculados: Number(computed.earned.dias_ganados),
        disponibles: computed.disponibles,
        id_saldo_vacaciones: Number(idSaldo),
      },
    };
  } catch (error) {
    if (!tx.finished) await tx.rollback();
    throw error;
  }
};
