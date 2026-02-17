import dayjs from "dayjs";

/**
 * Agrupa marcas por día (YYYY-MM-DD)
 * @param {Array<{id_marca:number, tipo_marca:string|null, timestamp:Date|string, observaciones:any}>} marcas
 */
export const agruparMarcasPorDia = (marcas) => {
  const map = new Map();

  for (const marca of marcas) {
    const dia = dayjs(marca.timestamp).format("YYYY-MM-DD");

    if (!map.has(dia)) {
      map.set(dia, { dia, asistencia: [] });
    }

    map.get(dia).asistencia.push(marca);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.dia < b.dia) return -1;
    if (a.dia > b.dia) return 1;
    return 0;
  });
};
