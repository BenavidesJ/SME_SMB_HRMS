import { Op } from "sequelize";

/**
 * Indexa jornadas por fecha para busqueda O(1) en el timeline.
 *
 * Map<YYYY-MM-DD, {
 *   date: string,
 *   horas_trabajadas: number,
 *   horas_extra: number,
 *   horas_nocturnas: number,
 *   feriado_obligatorio: 0|1,
 *   source: any
 * }>
 */
export function indexAttendanceByDate(jornadaRows) {
  const map = new Map();

  for (const r of jornadaRows || []) {
    const dateStr = String(r.fecha);

    map.set(dateStr, {
      date: dateStr,
      horas_trabajadas: Number(r.horas_trabajadas ?? 0),
      horas_extra: Number(r.horas_extra ?? 0),
      horas_nocturnas: Number(r.horas_nocturnas ?? 0),
      feriado_obligatorio: Number(r.feriado_obligatorio ?? 0) ? 1 : 0,
      source: r,
    });
  }

  return map;
}

/**
 * Carga jornadas diarias del colaborador dentro del rango inclusive.
 *
 * @param {{
 *   idColaborador: number,
 *   startDate: string, // YYYY-MM-DD
 *   endDate: string,   // YYYY-MM-DD
 *   models: { JornadaDiaria: any },
 *   transaction?: any
 * }} params
 *
 * @returns {Promise<{ rows: any[], indexByDate: Map<string, any> }>}
 */
export async function loadAttendanceForTimeline({
  idColaborador,
  startDate,
  endDate,
  models,
  transaction,
}) {
  if (!models?.JornadaDiaria) {
    throw new Error("loadAttendanceForTimeline: models.JornadaDiaria es requerido");
  }
  if (!Number.isFinite(Number(idColaborador))) {
    throw new Error("loadAttendanceForTimeline: idColaborador inválido");
  }
  if (!startDate || !endDate) {
    throw new Error("loadAttendanceForTimeline: startDate/endDate requeridos");
  }

  const rows = await models.JornadaDiaria.findAll({
    where: {
      id_colaborador: Number(idColaborador),
      fecha: { [Op.between]: [startDate, endDate] },
    },
    attributes: [
      "id_jornada",
      "id_colaborador",
      "fecha",
      "horas_trabajadas",
      "horas_extra",
      "horas_nocturnas",
      "feriado_obligatorio",
    ],
    order: [["fecha", "ASC"]],
    transaction,
  });

  const indexByDate = indexAttendanceByDate(rows);

  return { rows, indexByDate };
}
