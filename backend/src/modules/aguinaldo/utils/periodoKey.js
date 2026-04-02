const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeDateOnly(value, fieldName) {
  const normalized = String(value ?? "").trim();
  if (!DATE_ONLY_REGEX.test(normalized)) {
    throw new Error(`El campo ${fieldName} debe tener formato YYYY-MM-DD`);
  }

  return normalized;
}

export function normalizeYear(value, fieldName = "anio") {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`El campo ${fieldName} debe ser un numero entero positivo`);
  }

  return parsed;
}

export function buildAguinaldoPeriodoKey({ anio, periodo_desde, periodo_hasta, fecha_pago }) {
  const normalizedYear = normalizeYear(anio);
  const normalizedDesde = normalizeDateOnly(periodo_desde, "periodo_desde");
  const normalizedHasta = normalizeDateOnly(periodo_hasta, "periodo_hasta");
  const normalizedPago = normalizeDateOnly(fecha_pago, "fecha_pago");

  return `${normalizedYear}|${normalizedDesde}|${normalizedHasta}|${normalizedPago}`;
}

export function parseAguinaldoPeriodoKey(periodoKey) {
  const decoded = decodeURIComponent(String(periodoKey ?? "").trim());
  const parts = decoded.split("|");

  if (parts.length !== 4) {
    throw new Error("La clave de periodo es invalida");
  }

  const [anioRaw, periodoDesdeRaw, periodoHastaRaw, fechaPagoRaw] = parts;

  return {
    anio: normalizeYear(anioRaw),
    periodo_desde: normalizeDateOnly(periodoDesdeRaw, "periodo_desde"),
    periodo_hasta: normalizeDateOnly(periodoHastaRaw, "periodo_hasta"),
    fecha_pago: normalizeDateOnly(fechaPagoRaw, "fecha_pago"),
  };
}

export function assertValidDateRange(periodoDesde, periodoHasta) {
  const fromMs = new Date(`${periodoDesde}T00:00:00`).getTime();
  const toMs = new Date(`${periodoHasta}T00:00:00`).getTime();

  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    throw new Error("No se pudo validar el rango de fechas del periodo");
  }

  if (fromMs > toMs) {
    throw new Error("El periodo desde no puede ser posterior al periodo hasta");
  }
}