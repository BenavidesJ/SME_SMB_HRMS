import dayjs from "dayjs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const INCAPACITY_TYPES = Object.freeze({
  ENFERMEDAD: "ENFERMEDAD",
  INS: "INS",
  MATERNIDAD: "MATERNIDAD",
});

/**
 * Normaliza y valida dateStr (YYYY-MM-DD).
 */
function assertDateStr(dateStr, fieldName = "date") {
  if (typeof dateStr !== "string" || !DATE_RE.test(dateStr)) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD`);
  }

  const d = dayjs(dateStr, "YYYY-MM-DD", true);
  if (!d.isValid()) {
    throw new Error(`${fieldName} no es una fecha válida YYYY-MM-DD`);
  }

  return d;
}

function* iterateDatesInclusive(startDate, endDate) {
  let cursor = dayjs(startDate, "YYYY-MM-DD", true).startOf("day");
  const end = dayjs(endDate, "YYYY-MM-DD", true).startOf("day");

  if (!cursor.isValid() || !end.isValid()) {
    throw new Error("iterateDatesInclusive: invalid date(s)");
  }
  if (cursor.isAfter(end)) {
    throw new Error("iterateDatesInclusive: startDate debe ser <= endDate");
  }

  while (cursor.isSame(end) || cursor.isBefore(end)) {
    yield cursor.format("YYYY-MM-DD");
    cursor = cursor.add(1, "day");
  }
}

function isWorkdayByTemplate({ dateStr, template }) {
  if (!template) return true;

  const tz = template.timezone || "America/Costa_Rica";

  const dayIndex = dayjs(dateStr, "YYYY-MM-DD", true).isoWeekday() - 1;

  const isRestDay = Array.isArray(template.restDays) && template.restDays.includes(dayIndex);
  const windows = template.virtualWindowsByDay?.[dayIndex] || [];
  const hasVirtual = Array.isArray(windows) && windows.length > 0;

  const isWorkday = hasVirtual && !isRestDay;
  return Boolean(isWorkday);
}

function isHoliday({ dateStr, holidaysMap }) {
  return Boolean(holidaysMap?.has?.(dateStr));
}

export function getRatesForEpisodeDay({ tipoNombre, dayNumber }) {
  const tipo = String(tipoNombre ?? "").trim().toUpperCase();
  const n = Number(dayNumber);

  if (!tipo) throw new Error("getRatesForEpisodeDay: tipoNombre es requerido");
  if (!Number.isFinite(n) || n < 1) {
    throw new Error("getRatesForEpisodeDay: dayNumber debe ser >= 1");
  }

  switch (tipo) {
    case INCAPACITY_TYPES.ENFERMEDAD: {
      // CCSS enfermedad común:
      // - Días 1-3: 50% patrono + 50% CCSS
      // - Día 4+: CCSS 60%
      if (n <= 3) return { employerPct: 50, insurerPct: 50, tramo: "D1_3" };
      return { employerPct: 0, insurerPct: 60, tramo: "D4_PLUS" };
    }

    case INCAPACITY_TYPES.INS: {
      // Riesgos del trabajo (INS):
      // - Días 1-3: patrono 100%
      // - Días 4-45: INS 60%
      // - Día 46+: INS paga 100% mínimo + 60% excedente (requiere salario mínimo para cálculo exacto)
      if (n <= 3) return { employerPct: 100, insurerPct: 0, tramo: "D1_3" };
      if (n <= 45) return { employerPct: 0, insurerPct: 60, tramo: "D4_45" };

      return { employerPct: 0, insurerPct: 60, tramo: "D46_PLUS_MVP" };
    }

    case INCAPACITY_TYPES.MATERNIDAD: {
      return { employerPct: 0, insurerPct: 100, tramo: "ALL" };
    }

    default:
      throw new Error(`Tipo incapacidad no soportado: ${tipo}`);
  }
}

/**
 * Construye para planilla:
 * - calendarDates: todas las fechas del rango (para contar día 1..N)
 * - payableDates: fechas donde sí se paga algo según reglas del tipo
 */
export function buildIncapacityEpisodePlan({
  tipoNombre,
  fecha_inicio,
  fecha_fin,
  template = null,
  holidaysMap = null,
}) {
  const tipo = String(tipoNombre ?? "").trim().toUpperCase();
  if (!tipo) throw new Error("buildIncapacityEpisodePlan: tipoNombre es requerido");

  const start = assertDateStr(fecha_inicio, "fecha_inicio").format("YYYY-MM-DD");
  const end = assertDateStr(fecha_fin, "fecha_fin").format("YYYY-MM-DD");

  const startD = dayjs(start, "YYYY-MM-DD", true);
  const endD = dayjs(end, "YYYY-MM-DD", true);
  if (endD.isBefore(startD)) {
    throw new Error("fecha_fin no puede ser menor que fecha_inicio");
  }

  const calendarDates = [];
  const payableDates = [];
  const skippedDates = [];

  for (const dateStr of iterateDatesInclusive(start, end)) {
    calendarDates.push(dateStr);

    if (tipo === INCAPACITY_TYPES.MATERNIDAD) {
      payableDates.push(dateStr);
      continue;
    }

    const workday = isWorkdayByTemplate({ dateStr, template });
    if (!workday) {
      skippedDates.push({ date: dateStr, reason: "NON_WORKDAY_OR_REST" });
      continue;
    }

    if (isHoliday({ dateStr, holidaysMap })) {
      skippedDates.push({ date: dateStr, reason: "HOLIDAY" });
      continue;
    }

    payableDates.push(dateStr);
  }

  return {
    tipo,
    start,
    end,
    totalCalendarDays: calendarDates.length,
    calendarDates,
    payableDates,
    skippedDates,
    getRatesForEpisodeDay: (dayNumber) => getRatesForEpisodeDay({ tipoNombre: tipo, dayNumber }),
  };
}

/**
 * BACKWARD COMPAT (temporal):
 * Esta función ya NO representa correctamente una incapacidad completa,
 * pero la dejamos para no romper el create actual.
 *
 * - Retorna un "resumen" informativo.
 * - NO debe usarse para cálculo real en planilla.
 */
export function computeIncapacityPolicy({ tipoNombre, fecha_inicio, fecha_fin }) {
  const plan = buildIncapacityEpisodePlan({
    tipoNombre,
    fecha_inicio,
    fecha_fin,
    template: null,
    holidaysMap: null,
  });

  const totalDays = plan.totalCalendarDays;

  let porcentaje_patrono = 0;
  let porcentaje_ccss = 0;

  if (plan.tipo === INCAPACITY_TYPES.ENFERMEDAD) {
    if (totalDays <= 3) {
      porcentaje_patrono = 50;
      porcentaje_ccss = 50;
    } else {
      porcentaje_patrono = 0;
      porcentaje_ccss = 60;
    }
  } else if (plan.tipo === INCAPACITY_TYPES.INS) {
    if (totalDays <= 3) {
      porcentaje_patrono = 100;
      porcentaje_ccss = 0;
    } else {
      porcentaje_patrono = 0;
      porcentaje_ccss = 60;
    }
  } else if (plan.tipo === INCAPACITY_TYPES.MATERNIDAD) {
    porcentaje_patrono = 0;
    porcentaje_ccss = 100;
  } else {
    throw new Error(`Tipo incapacidad no soportado: ${plan.tipo}`);
  }

  return {
    tipo: plan.tipo,
    start: plan.start,
    end: plan.end,
    totalDays,
    porcentaje_patrono,
    porcentaje_ccss,
    meta: {
      notes: [
        "AVISO: porcentaje_patrono/porcentaje_ccss es un resumen legacy.",
        "Para planilla, use buildIncapacityEpisodePlan + getRatesForEpisodeDay(dayN).",
      ],
    },
  };
}

/**
 * Convierte el resultado del policy a los campos exactos.
 */
export function toIncapacityDbFields(policyResult) {
  if (!policyResult) throw new Error("policyResult es requerido");

  const patrono = Number(policyResult.porcentaje_patrono);
  const ccss = Number(policyResult.porcentaje_ccss);

  if (!Number.isFinite(patrono) || patrono < 0 || patrono > 100) {
    throw new Error("porcentaje_patrono inválido");
  }
  if (!Number.isFinite(ccss) || ccss < 0 || ccss > 100) {
    throw new Error("porcentaje_ccss inválido");
  }

  return {
    porcentaje_patrono: patrono,
    porcentaje_ccss: ccss,
  };
}
