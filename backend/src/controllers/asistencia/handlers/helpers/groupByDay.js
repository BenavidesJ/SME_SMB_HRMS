import dayjs from "dayjs";

/**
 * Agrupa marcas por día (YYYY-MM-DD)
 * @param {Array<{id_marca:number, tipo_marca:string|null, timestamp:Date|string, observaciones:any}>} marcas
 * @param {{ useUTC?: boolean }} options
 */
export const groupByDay = (marcas, { useUTC = false } = {}) => {
  const map = new Map();

  for (const m of marcas) {
    const dia = useUTC
      ? dayjs(m.timestamp).utc().format("YYYY-MM-DD")
      : dayjs(m.timestamp).format("YYYY-MM-DD");

    if (!map.has(dia)) {
      map.set(dia, { dia, asistencia: [] });
    }

    map.get(dia).asistencia.push(m);
  }

  return Array.from(map.values()).sort((a, b) => (a.dia < b.dia ? -1 : a.dia > b.dia ? 1 : 0));
};