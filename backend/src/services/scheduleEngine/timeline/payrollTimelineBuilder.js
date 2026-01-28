import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

import { loadActiveContractAndTemplate, loadHolidaysMap } from "../providers/sequelizeScheduleProvider.js";
import { getDayContext } from "../dayContext.js";
import { loadIncapacityBlocksByDateRange } from "../providers/sequelizeIncapacityProvider.js";
import { getVacacionesByDateRange } from "../providers/sequelizeVacationProvider.js";

dayjs.extend(utc);
dayjs.extend(timezone);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function assertDateOnly(dateStr, fieldName) {
  if (typeof dateStr !== "string" || !DATE_RE.test(dateStr)) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD`);
  }
  const d = dayjs(dateStr, "YYYY-MM-DD", true);
  if (!d.isValid()) throw new Error(`${fieldName} no es una fecha válida`);
  return d;
}

function* iterateDatesInclusive(startDate, endDate, tz) {
  let cursor = dayjs.tz(startDate, tz).startOf("day");
  const end = dayjs.tz(endDate, tz).startOf("day");

  if (!cursor.isValid() || !end.isValid()) throw new Error("iterateDatesInclusive: invalid date");
  if (cursor.isAfter(end)) throw new Error("iterateDatesInclusive: startDate must be <= endDate");

  while (cursor.isSame(end) || cursor.isBefore(end)) {
    yield cursor.format("YYYY-MM-DD");
    cursor = cursor.add(1, "day");
  }
}

function rangesOverlapInclusive(aStart, aEnd, bStart, bEnd) {
  return String(aStart) <= String(bEnd) && String(aEnd) >= String(bStart);
}

function isContiguous(prevEnd, nextStart, tz) {
  const a = dayjs.tz(prevEnd, tz).startOf("day");
  const b = dayjs.tz(nextStart, tz).startOf("day");
  return b.diff(a, "day") === 1;
}

/**
 * Une incapacidades en "episodios" para que una extensión contigua
 * NO reinicie el conteo de días (1-3).
 *
 * Regla de merge (MVP):
 * - mismo id_colaborador
 * - mismo tipo (nombre)
 * - contiguas (prev.fecha_fin + 1 día == next.fecha_inicio) o traslapadas
 *
 * @param {Array} rows - incapacidades ordenadas por fecha_inicio asc
 * @param {string} tz
 * @returns {Array<{
 *   episodeId: string,
 *   tipoNombre: string|null,
 *   startDate: string,
 *   endDate: string,
 *   rows: Array
 * }>}
 */
function buildIncapacityEpisodes(rows, tz) {
  const out = [];
  let current = null;

  for (const r of rows || []) {
    const tipoNombre = String(r?.tipoIncapacidad?.nombre ?? "").trim().toUpperCase() || null;
    const startDate = String(r.fecha_inicio);
    const endDate = String(r.fecha_fin);

    if (!current) {
      current = {
        episodeId: `INCAP-EP-${r.id_incapacidad}`,
        tipoNombre,
        startDate,
        endDate,
        rows: [r],
      };
      continue;
    }

    const sameTipo = current.tipoNombre === tipoNombre;
    const overlaps = rangesOverlapInclusive(current.startDate, current.endDate, startDate, endDate);
    const contig = isContiguous(current.endDate, startDate, tz);

    if (sameTipo && (overlaps || contig)) {
      if (String(endDate) > String(current.endDate)) current.endDate = endDate;
      current.rows.push(r);
    } else {
      out.push(current);
      current = {
        episodeId: `INCAP-EP-${r.id_incapacidad}`,
        tipoNombre,
        startDate,
        endDate,
        rows: [r],
      };
    }
  }

  if (current) out.push(current);
  return out;
}

function findEpisodeForDate(episodes, dateStr) {
  for (const ep of episodes || []) {
    if (String(ep.startDate) <= String(dateStr) && String(ep.endDate) >= String(dateStr)) return ep;
  }
  return null;
}

/**
 * Normaliza el tipo de incapacidad a tu catálogo estable:
 * ENFERMEDAD | INS | MATERNIDAD
 */
function normalizeIncapacityTipo(tipoNombre) {
  const t = String(tipoNombre ?? "").trim().toUpperCase();
  if (t === "ENFERMEDAD") return "ENFERMEDAD";
  if (t === "INS") return "INS";
  if (t === "MATERNIDAD") return "MATERNIDAD";
  return t || null;
}

function computeIncapacityPercentForEpisodeDay({ tipo, episodeDayNumber }) {
  if (!tipo || !episodeDayNumber) {
    return { employerPercent: 0, providerPercent: 0, provider: null };
  }

  if (tipo === "ENFERMEDAD") {
    if (episodeDayNumber <= 3) return { employerPercent: 50, providerPercent: 50, provider: "CCSS" };
    return { employerPercent: 0, providerPercent: 60, provider: "CCSS" };
  }

  if (tipo === "INS") {
    if (episodeDayNumber <= 3) return { employerPercent: 100, providerPercent: 0, provider: "INS" };
    return { employerPercent: 0, providerPercent: 60, provider: "INS" };
  }

  if (tipo === "MATERNIDAD") {
    return { employerPercent: 50, providerPercent: 50, provider: "CCSS" };
  }

  return { employerPercent: 0, providerPercent: 0, provider: null };
}

function mapVacationsToBlocks(vacRows) {
  return (vacRows || []).map((v) => ({
    id: v.id_solicitud_vacaciones ?? null,
    startDate: String(v.fecha_inicio),
    endDate: String(v.fecha_fin),
    raw: v,
  }));
}

function findVacationBlockCoveringDate(blocks, dateStr) {
  return (blocks || []).find(
    (b) => String(b.startDate) <= String(dateStr) && String(b.endDate) >= String(dateStr)
  );
}

/**
 * Builder: produce timeline por rango inclusive
 *
 * @param {{
 *  idColaborador: number|string,
 *  startDate: string,  // YYYY-MM-DD inclusive
 *  endDate: string,    // YYYY-MM-DD inclusive
 *  models: any,
 *  config?: any,
 *  providers?: {
 *    loadLeavesInRange?: Function,            // (ctx) => Array<leaveBlocks>
 *    loadAttendanceByDateRange?: Function,    // (ctx) => Map<dateStr, jornadaInfo>
 *    loadApprovedOvertimeByDateRange?: Function // (ctx) => Map<dateStr, hours>
 *  }
 * }} params
 */
export async function buildPayrollTimeline({
  idColaborador,
  startDate,
  endDate,
  models,
  config,
  providers = {},
}) {
  const id = Number(idColaborador);
  if (!Number.isFinite(id)) throw new Error("buildPayrollTimeline: idColaborador inválido");

  assertDateOnly(startDate, "startDate");
  assertDateOnly(endDate, "endDate");
  if (String(endDate) < String(startDate)) throw new Error("endDate debe ser >= startDate");
  if (!models) throw new Error("buildPayrollTimeline: models requerido");

  const { contrato, template } = await loadActiveContractAndTemplate({
    idColaborador: id,
    models,
    config,
  });

  const tz = template.timezone || "America/Costa_Rica";

  const holidaysMap = await loadHolidaysMap({
    startDate,
    endDate,
    models: { Feriado: models.Feriado },
  });

  const incapRows = await loadIncapacityBlocksByDateRange({
    models: { Incapacidad: models.Incapacidad, TipoIncapacidad: models.TipoIncapacidad },
    idColaborador: id,
    fromDateStr: startDate,
    toDateStr: endDate,
  });

  incapRows.sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)));

  const incapEpisodes = buildIncapacityEpisodes(incapRows, tz);

  const vacRows = await getVacacionesByDateRange({
    models: { SolicitudVacaciones: models.SolicitudVacaciones },
    idColaborador: id,
    startDate,
    endDate,
  });

  const vacationBlocks = mapVacationsToBlocks(vacRows);

  const leaveBlocks = providers.loadLeavesInRange
    ? await providers.loadLeavesInRange({ idColaborador: id, startDate, endDate, models, template, holidaysMap })
    : [];

  const attendanceByDate = providers.loadAttendanceByDateRange
    ? await providers.loadAttendanceByDateRange({ idColaborador: id, startDate, endDate, models, template })
    : new Map();

  const overtimeApprovedByDate = providers.loadApprovedOvertimeByDateRange
    ? await providers.loadApprovedOvertimeByDateRange({ idColaborador: id, startDate, endDate, models, template })
    : new Map();

  const timeline = [];

  for (const dateStr of iterateDatesInclusive(startDate, endDate, tz)) {
    const ctx = getDayContext({ dateStr, template, holidaysMap });

    const ep = findEpisodeForDate(incapEpisodes, dateStr);
    const vac = !ep ? findVacationBlockCoveringDate(vacationBlocks, dateStr) : null;

    let event = null;
    const subEvents = [];

    const leavesForDay = (leaveBlocks || []).filter((b) => b?.date === dateStr || b?.dateStr === dateStr);
    for (const lb of leavesForDay) {
      subEvents.push({
        type: "PERMISO",
        id: lb.id ?? null,
        meta: { ...lb },
      });
    }

    const approvedHx = overtimeApprovedByDate?.get?.(dateStr);
    if (Number.isFinite(Number(approvedHx)) && Number(approvedHx) > 0) {
      subEvents.push({
        type: "HORA_EXTRA_APROBADA",
        id: null,
        meta: { horas_aprobadas: Number(approvedHx) },
      });
    }

    const jornada = attendanceByDate?.get?.(dateStr) ?? null;

    const payrollHints = {
      payable: false,
      blocksAttendance: false,
      incapacity: null,
      vacation: null,
      attendance: null,
      leave: null,
    };

    if (ep) {
      event = {
        type: "INCAPACIDAD",
        id: ep.rows?.[0]?.id_incapacidad ?? null,
        meta: {
          episodeId: ep.episodeId,
          tipo: normalizeIncapacityTipo(ep.tipoNombre),
          startDate: ep.startDate,
          endDate: ep.endDate,
        },
      };

      const episodeDayNumber =
        dayjs.tz(dateStr, tz).startOf("day").diff(dayjs.tz(ep.startDate, tz).startOf("day"), "day") + 1;

      const tipo = normalizeIncapacityTipo(ep.tipoNombre);
      const perc = computeIncapacityPercentForEpisodeDay({ tipo, episodeDayNumber });

      const isMandatoryHoliday = Boolean(ctx.isHoliday && ctx.holidayInfo?.es_obligatorio);

      payrollHints.blocksAttendance = true;
      payrollHints.incapacity = {
        episodeId: ep.episodeId,
        episodeDayNumber,
        employerPercent: perc.employerPercent,
        providerPercent: perc.providerPercent,
        provider: perc.provider,
        reason: tipo,
      };

      payrollHints.payable = !isMandatoryHoliday && perc.employerPercent > 0;
    } else if (vac) {
      event = {
        type: "VACACIONES",
        id: vac.id,
        meta: { startDate: vac.startDate, endDate: vac.endDate },
      };

      payrollHints.blocksAttendance = true;
      const isMandatoryHoliday = Boolean(ctx.isHoliday && ctx.holidayInfo?.es_obligatorio);
      payrollHints.vacation = { chargeable: ctx.isWorkday && !ctx.isHoliday };
      payrollHints.payable = ctx.isWorkday && !isMandatoryHoliday;
    } else if (ctx.isWorkday) {
      event = { type: "TRABAJO", id: null, meta: {} };
      payrollHints.blocksAttendance = false;
      payrollHints.payable = true;

      if (jornada) {
        payrollHints.attendance = {
          ordinaryHours: Number(jornada.horas_trabajadas ?? 0),
          nocturnalHours: Number(jornada.horas_nocturnas ?? 0),
          extraCandidateHours: Number(jornada.horas_extra_candidata ?? 0),
          extraApprovedHours: Number(jornada.horas_extra ?? 0),
          workedOnHoliday: Boolean(jornada.feriado_obligatorio),
        };
      }
    } else {
      event = { type: "DESCANSO", id: null, meta: { reason: ctx.isRestDay ? "REST_DAY" : "NON_WORKDAY" } };
      payrollHints.blocksAttendance = false;
      payrollHints.payable = false;
    }

    if (leavesForDay.length) {
      const lb = leavesForDay[0];
      payrollHints.leave = {
        minutes: Number(lb.minutes ?? 0),
        hours: Number(lb.hours ?? 0),
        paid: Boolean(lb.paid ?? false),
      };
    }

    timeline.push({
      date: dateStr,
      dayContext: {
        isWorkday: Boolean(ctx.isWorkday),
        isRestDay: Boolean(ctx.isRestDay),
        isHoliday: Boolean(ctx.isHoliday),
        holidayName: ctx.holidayInfo?.nombre ?? null,
        isMandatoryHoliday: Boolean(ctx.isHoliday && ctx.holidayInfo?.es_obligatorio),
      },
      event,
      subEvents,
      payrollHints,
    });
  }

  return {
    id_colaborador: id,
    startDate,
    endDate,
    timezone: tz,
    contrato,
    timeline,
    debug: {
      incapacityEpisodes: incapEpisodes.map((e) => ({
        episodeId: e.episodeId,
        tipo: normalizeIncapacityTipo(e.tipoNombre),
        startDate: e.startDate,
        endDate: e.endDate,
        rows: e.rows?.map((r) => r.id_incapacidad) ?? [],
      })),
    },
  };
}
