import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const listCausasLiquidacion = async () =>
  (await models.CausaLiquidacion.findAll({ order: [["id_causa_liquidacion", "ASC"]] }))
    .map((causa) => ({ id: causa.id_causa_liquidacion, causa_liquidacion: causa.causa_liquidacion }));

export const getCausaLiquidacion = async ({ id }) => {
  const cid = requirePositiveInt(id, "id");
  const causa = await models.CausaLiquidacion.findByPk(cid);
  if (!causa) throw new Error(`No existe causa de liquidación con id ${cid}`);
  return { id: causa.id_causa_liquidacion, causa_liquidacion: causa.causa_liquidacion };
};
