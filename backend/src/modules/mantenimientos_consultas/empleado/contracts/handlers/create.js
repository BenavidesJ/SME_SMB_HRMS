import { models } from "../../../../../models/index.js";
import { runInTransaction } from "../../../shared/transaction.js";
import { ensureEstado } from "../../handlers/shared.js";
import {
  buildWarnings,
  ensureColaboradorExists,
  fetchContractById,
  normalizeFechaInicio,
  normalizeHorarioPayload,
  normalizeHorasSemanales,
  normalizeSalario,
  resolveCicloPago,
  resolvePuesto,
  resolveTipoContrato,
  resolveTipoJornada,
  validateHorasContraJornada,
} from "../helpers/shared.js";

export const createContractForColaborador = ({ id, payload }) =>
  runInTransaction(async (transaction) => {
    const colaborador = await ensureColaboradorExists(id, transaction);

    const estadoActivo = await ensureEstado("ACTIVO", transaction);
    const puesto = await resolvePuesto(payload.puesto, transaction);
    const tipoContrato = await resolveTipoContrato(payload.tipo_contrato, transaction);
    const tipoJornada = await resolveTipoJornada(payload.tipo_jornada, transaction);
    const ciclo = await resolveCicloPago(payload.ciclo_pago, transaction);

    const salarioBase = normalizeSalario(payload.salario_base);
    const horasSemanal = normalizeHorasSemanales(payload.horas_semanales, tipoJornada.max_horas_semanales);
    validateHorasContraJornada(horasSemanal, tipoJornada.max_horas_semanales);

    const fechaInicio = normalizeFechaInicio(payload.fecha_inicio);

    const horario = normalizeHorarioPayload(payload.horario);

    const contrato = await models.Contrato.create(
      {
        id_colaborador: colaborador.id_colaborador,
        id_puesto: puesto.id_puesto,
        fecha_inicio: fechaInicio,
        id_tipo_contrato: tipoContrato.id_tipo_contrato,
        id_tipo_jornada: tipoJornada.id_tipo_jornada,
        horas_semanales: horasSemanal,
        salario_base: salarioBase,
        id_ciclo_pago: ciclo.id_ciclo_pago,
        estado: estadoActivo.id_estado,
      },
      { transaction }
    );

    await models.HorarioLaboral.create(
      {
        id_contrato: contrato.id_contrato,
        hora_inicio: horario.horaInicio,
        hora_fin: horario.horaFin,
        minutos_descanso: horario.minutosDescanso,
        dias_laborales: horario.diasLaborales,
        dias_libres: horario.diasLibres,
        estado: estadoActivo.id_estado,
        fecha_actualizacion: horario.fechaActualizacion,
        id_tipo_jornada: tipoJornada.id_tipo_jornada,
      },
      { transaction }
    );

    const warnings = buildWarnings(puesto, salarioBase);
    const data = await fetchContractById(contrato.id_contrato, transaction);

    return { contrato: data, warnings };
  });
