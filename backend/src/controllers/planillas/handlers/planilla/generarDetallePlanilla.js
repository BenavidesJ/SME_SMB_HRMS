import dayjs from "dayjs";
import { Op } from "sequelize";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

import { buildPayrollTimeline } from "../../../../services/scheduleEngine/timeline/payrollTimelineBuilder.js";
import { loadLeaveBlocksForTimeline } from "../../../../services/scheduleEngine/providers/sequelizeLeaveBlocksProvider.js";
import { loadAttendanceForTimeline } from "../../../../services/scheduleEngine/providers/sequelizeAttendanceProvider.js";
import { loadApprovedOvertimeByDateRange } from "../../../../services/scheduleEngine/providers/sequelizeApprovedOvertimeProvider.js";

function toNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function assertDateStr(dateStr, fieldName) {
  const d = dayjs(dateStr, "YYYY-MM-DD", true);
  if (!d.isValid()) throw new Error(`${fieldName} inválido. Use YYYY-MM-DD`);
  return d;
}

export async function generarDetallePlanilla({ models, payload, config }) {
  const {
    id_periodo_planilla,
    id_colaboradores,
    fecha_inicio,
    fecha_fin,
    generado_por,
    id_ciclo_pago = 1,
  } = payload ?? {};

  if (!models?.sequelize) throw new Error("models.sequelize es requerido");
  if (!Array.isArray(id_colaboradores) || id_colaboradores.length === 0) {
    throw new Error("id_colaboradores es requerido");
  }
  if (!generado_por) throw new Error("generado_por es requerido");

  const start = assertDateStr(fecha_inicio, "fecha_inicio");
  const end = assertDateStr(fecha_fin, "fecha_fin");
  if (end.isBefore(start)) throw new Error("fecha_fin no puede ser menor que fecha_inicio");

  const cicloPagoNum = Number(id_ciclo_pago);
  if (!Number.isInteger(cicloPagoNum) || cicloPagoNum <= 0) {
    throw new Error("id_ciclo_pago inválido");
  }

  const estadoActivo = await models.Estado.findOne({ where: { estado: "ACTIVO" } });
  if (!estadoActivo) throw new Error('No existe Estado con estado="ACTIVO"');

  const idEstadoActivo = Number(estadoActivo.id_estado);

  const [periodo] = await models.PeriodoPlanilla.findOrCreate({
    where: {
      id_periodo: id_periodo_planilla, 
      fecha_inicio: start.format("YYYY-MM-DD"),
      fecha_fin: end.format("YYYY-MM-DD"),
      id_ciclo_pago: cicloPagoNum,
    },
    defaults: {
      fecha_inicio: start.format("YYYY-MM-DD"),
      fecha_fin: end.format("YYYY-MM-DD"),
      fecha_pago: end.format("YYYY-MM-DD"),
      id_ciclo_pago: cicloPagoNum,
      estado: idEstadoActivo,
      descripcion: `Periodo ${start.format("YYYY-MM-DD")} a ${end.format("YYYY-MM-DD")}`,
    },
  });

  const id_periodo = Number(periodo.id_periodo);
  const resultados = [];

  for (const rawId of id_colaboradores) {
    const idColaborador = Number(rawId);
    if (!Number.isInteger(idColaborador) || idColaborador <= 0) {
      resultados.push({ id_colaborador: rawId, ok: false, motivo: "id_colaborador inválido" });
      continue;
    }

    const tx = await models.sequelize.transaction();
    try {
      const timelineRes = await buildPayrollTimeline({
        idColaborador,
        startDate: start.format("YYYY-MM-DD"),
        endDate: end.format("YYYY-MM-DD"),
        models,
        config,
        providers: {
          loadLeavesInRange: async ({ idColaborador, startDate, endDate, models }) => {
            const { indexByDate } = await loadLeaveBlocksForTimeline({
              idColaborador,
              startDate,
              endDate,
              models: { SolicitudPermisosLicencias: models.SolicitudPermisosLicencias },
              blockingStatusIds: config?.leaveBlockingStatusIds ?? [],
              tz: config?.tz ?? "America/Costa_Rica",
            });

            const out = [];
            for (const [date, agg] of indexByDate.entries()) {
              out.push({ date, minutes: agg.totalMinutes, hours: agg.totalHours });
            }
            return out;
          },

          loadAttendanceByDateRange: async ({ idColaborador, startDate, endDate, models }) => {
            const { indexByDate } = await loadAttendanceForTimeline({
              idColaborador,
              startDate,
              endDate,
              models: { JornadaDiaria: models.JornadaDiaria },
            });
            return indexByDate;
          },

          loadApprovedOvertimeByDateRange: async ({ idColaborador, startDate, endDate, models }) => {
            return loadApprovedOvertimeByDateRange({
              models: { SolicitudHoraExtra: models.SolicitudHoraExtra },
              idColaborador,
              startDate,
              endDate,
              approvedEstadoIds: config?.overtimeApprovedEstadoIds ?? [],
            });
          },
        },
      });

      const contrato = timelineRes?.contrato;
      if (!contrato) throw new Error("No se encontró contrato activo");

      const salario_base = toNumber(contrato.salario_base);
      const id_contrato = Number(contrato.id_contrato);
      const id_tipo_jornada = Number(contrato.id_tipo_jornada);

      const tipoJornada = await models.TipoJornada.findByPk(id_tipo_jornada, { transaction: tx });
      if (!tipoJornada) throw new Error("TipoJornada no existe");

      const max_horas_diarias = toNumber(tipoJornada.max_horas_diarias);
      const salario_hora = (salario_base / 30) / max_horas_diarias;

      const jornadas = await models.JornadaDiaria.findAll({
        where: {
          id_colaborador: idColaborador,
          fecha: { [Op.between]: [start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD")] },
        },
        transaction: tx,
      });

      let horas_ordinarias = 0;
      for (const j of jornadas) {
        horas_ordinarias += Math.floor(
          toNumber(j.horas_trabajadas ?? j.get?.("horas_trabajadas"))
        );
      }
      horas_ordinarias = round2(horas_ordinarias);

      const bruto = round2(horas_ordinarias * salario_hora);
      const deducciones = 0;
      const neto = round2(bruto - deducciones);

      const row = await models.DetallePlanilla.create({
        id_periodo,
        id_colaborador: idColaborador,
        id_contrato,
        horas_ordinarias,
        horas_extra: 0,
        horas_feriado: 0,
        horas_nocturnas: 0,
        bruto,
        deducciones,
        neto,
        generado_por: Number(generado_por),
      }, { transaction: tx });

      await tx.commit();

      resultados.push({
        id_colaborador: idColaborador,
        ok: true,
        id_detalle: row.id_detalle,
        horas_ordinarias,
        salario_hora: round2(salario_hora),
        bruto,
        neto,
      });
    } catch (err) {
      if (!tx.finished) await tx.rollback();
      resultados.push({
        id_colaborador: idColaborador,
        ok: false,
        motivo: err.message,
      });
    }
  }

  return {
    ok: true,
    id_periodo,
    fecha_inicio: start.format("YYYY-MM-DD"),
    fecha_fin: end.format("YYYY-MM-DD"),
    resultados,
  };
}
