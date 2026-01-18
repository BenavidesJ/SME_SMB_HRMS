/**
 * Provider que indica si el día es feriado obligatorio 1, si no lo es 0.
 *
 * @param {{
 *  models: { Feriado: any },
 *  dateStr: string, // YYYY-MM-DD
 *  transaction?: any
 * }} params
 */
export async function isMandatoryHolidayByDate({ models, dateStr, transaction }) {
  const { Feriado } = models;

  const row = await Feriado.findOne({
    where: { fecha: dateStr },
    attributes: ["id_feriado", "es_obligatorio"],
    transaction,
  });

  if (!row) return 0;

  return row.es_obligatorio ? 1 : 0;
}
