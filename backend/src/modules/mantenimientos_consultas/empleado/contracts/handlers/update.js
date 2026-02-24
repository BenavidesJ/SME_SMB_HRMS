import { models } from "../../../../../models/index.js";
import { runInTransaction } from "../../../shared/transaction.js";
import { ensureEstado } from "../../handlers/shared.js";
import {
  buildWarnings,
  ensureColaboradorExists,
  ensureSingleActiveContract,
  fetchContractById,
  normalizeFechaInicio,
  normalizeHorarioPayload,
  normalizeHorasSemanales,
  normalizeSalario,
  resolveJefeDirecto,
  resolvePuesto,
  resolveTipoContrato,
  resolveTipoJornada,
  validateHorasContraJornada,
} from "../helpers/shared.js";
import { requirePositiveInt, ensurePatchHasAllowedFields } from "../../../shared/validators.js";

const ALLOWED_FIELDS = new Set([
  "puesto",
  "fecha_inicio",
  "tipo_contrato",
  "tipo_jornada",
  "salario_base",
  "horas_semanales",
  "horario",
  "id_jefe_directo",
  "estado",
]);

export const updateContractForColaborador = ({ colaboradorId, contratoId, patch }) =>
  runInTransaction(async (transaction) => {
    const colaborador = await ensureColaboradorExists(colaboradorId, transaction);
    const contractId = requirePositiveInt(contratoId, "id_contrato");

    const contratoActual = await models.Contrato.findOne({
      where: { id_contrato: contractId, id_colaborador: colaborador.id_colaborador },
      transaction,
    });

    if (!contratoActual) {
      throw new Error(`No existe un contrato ${contractId} para el colaborador ${colaborador.id_colaborador}`);
    }

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new Error("El body debe ser un objeto con los campos a actualizar");
    }

    ensurePatchHasAllowedFields(patch, [...ALLOWED_FIELDS]);

    for (const key of Object.keys(patch)) {
      if (!ALLOWED_FIELDS.has(key)) {
        throw new Error(`Campo no permitido en el body: ${key}`);
      }
    }

    const estadoActual = await ensureEstado(contratoActual.estado, transaction);
    const estadoActivo = await ensureEstado("ACTIVO", transaction);

    let puesto = await models.Puesto.findByPk(contratoActual.id_puesto, { transaction });
    let tipoContrato = await models.TipoContrato.findByPk(contratoActual.id_tipo_contrato, { transaction });
    let tipoJornada = await models.TipoJornada.findByPk(contratoActual.id_tipo_jornada, { transaction });

    if (!puesto || !tipoContrato || !tipoJornada || !estadoActual) {
      throw new Error("No fue posible resolver la información actual del contrato");
    }

    const next = {
      id_puesto: contratoActual.id_puesto,
      id_tipo_contrato: contratoActual.id_tipo_contrato,
      id_tipo_jornada: contratoActual.id_tipo_jornada,
      fecha_inicio: contratoActual.fecha_inicio,
      horas_semanales: contratoActual.horas_semanales,
      salario_base: contratoActual.salario_base,
      id_jefe_directo: contratoActual.id_jefe_directo,
      estado: contratoActual.estado,
    };

    if (patch.puesto !== undefined) {
      puesto = await resolvePuesto(patch.puesto, transaction);
      next.id_puesto = puesto.id_puesto;
    }

    if (patch.tipo_contrato !== undefined) {
      tipoContrato = await resolveTipoContrato(patch.tipo_contrato, transaction);
      next.id_tipo_contrato = tipoContrato.id_tipo_contrato;
    }

    if (patch.tipo_jornada !== undefined) {
      tipoJornada = await resolveTipoJornada(patch.tipo_jornada, transaction);
      next.id_tipo_jornada = tipoJornada.id_tipo_jornada;
    }

    if (patch.fecha_inicio !== undefined) {
      next.fecha_inicio = normalizeFechaInicio(patch.fecha_inicio);
    }

    if (patch.salario_base !== undefined) {
      next.salario_base = normalizeSalario(patch.salario_base);
    }

    if (patch.horas_semanales !== undefined) {
      next.horas_semanales = normalizeHorasSemanales(patch.horas_semanales, tipoJornada.max_horas_semanales);
    } else if (patch.tipo_jornada !== undefined) {
      next.horas_semanales = normalizeHorasSemanales(next.horas_semanales, tipoJornada.max_horas_semanales);
    }

    if (patch.id_jefe_directo !== undefined) {
      const jefeDirecto = await resolveJefeDirecto(patch.id_jefe_directo, colaborador.id_colaborador, transaction);
      next.id_jefe_directo = jefeDirecto.id_colaborador;
    }

    let horario = null;
    if (patch.horario !== undefined) {
      horario = normalizeHorarioPayload(patch.horario);
    }

    validateHorasContraJornada(next.horas_semanales, tipoJornada.max_horas_semanales);

    if (patch.estado !== undefined) {
      const nuevoEstado = await ensureEstado(patch.estado, transaction);
      next.estado = nuevoEstado.id_estado;
    }

    if (next.estado === estadoActivo.id_estado && contratoActual.estado !== estadoActivo.id_estado) {
      await ensureSingleActiveContract({
        colaboradorId: colaborador.id_colaborador,
        excludeContractId: contractId,
        estadoActivoId: estadoActivo.id_estado,
        transaction,
      });
    }

    const updatePayload = {
      id_puesto: next.id_puesto,
      id_tipo_contrato: next.id_tipo_contrato,
      id_tipo_jornada: next.id_tipo_jornada,
      fecha_inicio: next.fecha_inicio,
      horas_semanales: next.horas_semanales,
      salario_base: next.salario_base,
      id_jefe_directo: next.id_jefe_directo,
      estado: next.estado,
    };

    await models.Contrato.update(updatePayload, {
      where: { id_contrato: contractId },
      transaction,
    });

    if (horario) {
      await models.HorarioLaboral.create(
        {
          id_contrato: contractId,
          hora_inicio: horario.horaInicio,
          hora_fin: horario.horaFin,
          dias_laborales: horario.diasLaborales,
          dias_libres: horario.diasLibres,
          estado: next.estado,
          fecha_actualizacion: horario.fechaActualizacion,
          id_tipo_jornada: next.id_tipo_jornada,
        },
        { transaction }
      );
    }

    const warnings = buildWarnings(puesto, next.salario_base);
    const contratoActualizado = await fetchContractById(contractId, transaction);

    return { contrato: contratoActualizado, warnings };
  });
