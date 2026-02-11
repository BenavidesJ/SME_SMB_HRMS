export function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function roundDecimal(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function serializePeriodo(periodo) {
  if (!periodo) return null;
  return {
    id: periodo.id_periodo,
    fecha_inicio: periodo.fecha_inicio,
    fecha_fin: periodo.fecha_fin,
    fecha_pago: periodo.fecha_pago,
    id_ciclo_pago: Number(periodo.ciclo_pago),
    estado: periodo.estadoRef?.estado ?? null,
    descripcion: null,
  };
}

export function serializePlanilla(detalle) {
  if (!detalle) return null;
  return {
    id_detalle: detalle.id_detalle,
    id_periodo: detalle.id_periodo,
    id_colaborador: detalle.id_colaborador,
    id_contrato: detalle.id_contrato,
    horas_ordinarias: toNumber(detalle.horas_ordinarias),
    horas_extra: toNumber(detalle.horas_extra),
    horas_feriado: toNumber(detalle.horas_feriado),
    horas_nocturnas: toNumber(detalle.horas_nocturnas),
    bruto: toNumber(detalle.bruto),
    deducciones: toNumber(detalle.deducciones),
    neto: toNumber(detalle.neto),
    generado_por: detalle.generado_por ?? null,
  };
}
