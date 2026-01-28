import { Op } from "sequelize";
import { buildScheduleTemplateFromHorario } from "../templateFromSchedule.js";

/**
 * Carga contrato activo + horario activo y genera el template.
 *
 * @param {Object} params
 * @param {number} params.idColaborador
 * @param {Object} params.models - tus modelos Sequelize { Contrato, HorarioLaboral }
 * @param {Object} params.config - config de estados { contratoActivoIds, horarioActivoIds }
 *
 * @returns {Promise<{ contrato: any, horario: any, template: any }>}
 */
export async function loadActiveContractAndTemplate({ idColaborador, models, config }) {
  if (!idColaborador) throw new Error("loadActiveContractAndTemplate: idColaborador es requerido");
  if (!models?.Contrato) throw new Error("loadActiveContractAndTemplate: models.Contrato es requerido");
  if (!models?.HorarioLaboral) throw new Error("loadActiveContractAndTemplate: models.HorarioLaboral es requerido");

  const contratoActivoIds = config?.contratoActivoIds ?? [];
  const horarioActivoIds = config?.horarioActivoIds ?? [];

  // uscar contrato activo del colaborador
  const contrato = await models.Contrato.findOne({
    where: {
      id_colaborador: idColaborador,
      ...(contratoActivoIds.length ? { estado: { [Op.in]: contratoActivoIds } } : {}),
    },
    order: [["fecha_inicio", "DESC"]],
  });

  if (!contrato) {
    throw new Error(`No hay contrato activo para id_colaborador=${idColaborador}`);
  }

  // Buscar horario laboral activo para ese contrato
  const horario = await models.HorarioLaboral.findOne({
    where: {
      id_contrato: contrato.id_contrato,
      ...(horarioActivoIds.length ? { estado: { [Op.in]: horarioActivoIds } } : {}),
    },
    order: [["fecha_actualizacion", "DESC"]],
  });

  if (!horario) {
    throw new Error(`No hay horario laboral activo para id_contrato=${contrato.id_contrato}`);
  }

  // Construir template desde horario
  const template = buildScheduleTemplateFromHorario({
    hora_inicio: horario.hora_inicio,
    hora_fin: horario.hora_fin,
    dias_laborales: horario.dias_laborales,
    dias_libres: horario.dias_libres,
    minutos_descanso: horario.minutos_descanso,
    id_tipo_jornada: horario.id_tipo_jornada,
    timezone: "America/Costa_Rica",
    realEndMin: 1440,
  });

  return { contrato, horario, template };
}

/**
 * Carga feriados entre startDate y endDate (inclusive) y devuelve Map por fecha.
 *
 * @param {Object} params
 * @param {string} params.startDate - YYYY-MM-DD
 * @param {string} params.endDate - YYYY-MM-DD
 * @param {Object} params.models - { Feriado }
 * @returns {Promise<Map<string, {nombre: string, es_obligatorio: number}>>}
 */
export async function loadHolidaysMap({ startDate, endDate, models }) {
  if (!models?.Feriado) throw new Error("loadHolidaysMap: models.Feriado is required");

  const rows = await models.Feriado.findAll({
    where: {
      fecha: {
        [Op.between]: [startDate, endDate],
      },
    },
    attributes: ["fecha", "nombre", "es_obligatorio"],
    order: [["fecha", "ASC"]],
  });

  const map = new Map();
  for (const r of rows) {
    map.set(String(r.fecha), {
      nombre: String(r.nombre),
      es_obligatorio: Number(r.es_obligatorio),
    });
  }

  return map;
}
