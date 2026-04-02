import { buildAguinaldoPeriodoKey } from "../../utils/periodoKey.js";

function toPlain(record) {
  if (record && typeof record.toJSON === "function") {
    return record.toJSON();
  }

  return record;
}

export function summarizePeriodoRecords(records) {
  const plainRecords = (records ?? []).map(toPlain);
  if (plainRecords.length === 0) {
    return null;
  }

  const first = plainRecords[0];
  const collaboratorIds = new Set();
  let totalMonto = 0;
  let latestById = null;

  for (const record of plainRecords) {
    collaboratorIds.add(Number(record.id_colaborador));
    totalMonto += Number(record.monto_calculado ?? 0);

    if (!latestById || Number(record.id_aguinaldo) > Number(latestById.id_aguinaldo)) {
      latestById = record;
    }
  }

  return {
    periodo_key: buildAguinaldoPeriodoKey(first),
    anio: Number(first.anio),
    periodo_desde: first.periodo_desde,
    periodo_hasta: first.periodo_hasta,
    fecha_pago: first.fecha_pago,
    cantidad_registros: plainRecords.length,
    total_colaboradores: collaboratorIds.size,
    monto_total: Math.round(totalMonto * 100) / 100,
    ultimo_registro_id: Number(latestById?.id_aguinaldo ?? first.id_aguinaldo),
    registrado_por_nombre: latestById?.registradoPor
      ? [
          latestById.registradoPor.nombre,
          latestById.registradoPor.primer_apellido,
          latestById.registradoPor.segundo_apellido,
        ].filter(Boolean).join(" ")
      : `Colaborador #${latestById?.registrado_por ?? first.registrado_por}`,
  };
}

export function groupAguinaldosByPeriodo(records) {
  const grouped = new Map();

  for (const record of records ?? []) {
    const plain = toPlain(record);
    const key = buildAguinaldoPeriodoKey(plain);

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key).push(plain);
  }

  return Array.from(grouped.values())
    .map((periodRecords) => summarizePeriodoRecords(periodRecords))
    .filter(Boolean)
    .sort((left, right) => {
      const leftPago = new Date(`${left.fecha_pago}T00:00:00`).getTime();
      const rightPago = new Date(`${right.fecha_pago}T00:00:00`).getTime();

      if (leftPago !== rightPago) {
        return rightPago - leftPago;
      }

      if (left.anio !== right.anio) {
        return right.anio - left.anio;
      }

      return right.ultimo_registro_id - left.ultimo_registro_id;
    });
}