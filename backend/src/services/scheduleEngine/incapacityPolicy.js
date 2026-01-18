import dayjs from "dayjs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const INCAPACITY_TYPES = {
  ENFERMEDAD: "ENFERMEDAD",
  MATERNIDAD: "MATERNIDAD",
  ACCIDENTE_TRANSITO: "ACCIDENTE_TRANSITO",
};

/**
 * Normaliza y valida dateStr (YYYY-MM-DD).
 */
function assertDateStr(dateStr, fieldName) {
  if (typeof dateStr !== "string" || !DATE_RE.test(dateStr)) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD`);
  }

  const d = dayjs(dateStr, "YYYY-MM-DD", true);
  if (!d.isValid()) {
    throw new Error(`${fieldName} no es una fecha válida YYYY-MM-DD`);
  }

  return d;
}

/**
 * Calcula el "plan" base de una incapacidad.
 *
 */
export function computeIncapacityPolicy({ tipoNombre, fecha_inicio, fecha_fin }) {
  const tipo = String(tipoNombre ?? "").trim().toUpperCase();
  if (!tipo) throw new Error("tipoNombre es requerido");

  const start = assertDateStr(fecha_inicio, "fecha_inicio");
  const end = assertDateStr(fecha_fin, "fecha_fin");

  const startD = dayjs(start, "YYYY-MM-DD", true);
  const endD = dayjs(end, "YYYY-MM-DD", true);

  if (endD.isBefore(startD)) {
    throw new Error("fecha_fin no puede ser menor que fecha_inicio");
  }

  const totalDays = endD.diff(startD, "day") + 1;

  const out = {
    tipo,
    start: startD.format("YYYY-MM-DD"),
    end: endD.format("YYYY-MM-DD"),
    totalDays,
    porcentaje_patrono: 0,
    porcentaje_ccss: 0,
    meta: {
      notes: [],
    },
  };

  switch (tipo) {
    case INCAPACITY_TYPES.ENFERMEDAD: {
      if (totalDays <= 3) {
        out.porcentaje_patrono = 50;
        out.porcentaje_ccss = 50;
        out.meta.notes.push("Incapacidad <= 3 días: patrono 50% / CCSS 50% (persistido)");
      } else {
        out.porcentaje_patrono = 0;
        out.porcentaje_ccss = 60;

        out.meta.firstDaysEmployerPercent = 50;
        out.meta.firstDaysCount = 3;
        out.meta.fromDay = 4;
        out.meta.notes.push("Días 1-3: patrono 50% (regla de planilla)");
        out.meta.notes.push("Día 4+: CCSS 60% (persistido como porcentaje_ccss)");
      }
      break;
    }

    case INCAPACITY_TYPES.ACCIDENTE_TRANSITO: {
      if (totalDays <= 3) {
        out.porcentaje_patrono = 50;
        out.porcentaje_ccss = 50;
        out.meta.notes.push("Incapacidad <= 3 días: patrono 50% / CCSS 50% (persistido)");
      } else {
        out.porcentaje_patrono = 0;
        out.porcentaje_ccss = 60;

        out.meta.firstDaysEmployerPercent = 50;
        out.meta.firstDaysCount = 3;
        out.meta.fromDay = 4;
        out.meta.notes.push("MVP: tratado como ENFERMEDAD");
        out.meta.notes.push("Días 1-3: patrono 50% (regla de planilla)");
        out.meta.notes.push("Día 4+: CCSS 60% (persistido como porcentaje_ccss)");
        out.meta.notes.push("Pendiente: regla SOA/agotamiento para pago CCSS");
      }
      break;
    }

    case INCAPACITY_TYPES.MATERNIDAD: {
      out.porcentaje_patrono = 50;
      out.porcentaje_ccss = 50;

      if (totalDays > 123) {
        out.meta.notes.push("Advertencia: excede 123 días (revisar caso)");
      }
      break;
    }

    default: {
      throw new Error(`Tipo incapacidad no soportado en MVP: ${tipo}`);
    }
  }

  return out;
}

/**
 * Convierte el resultado del policy a los campos exactos
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
