import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../shared/validators.js";

export const listCiclosPago = async () =>
  (await models.CicloPago.findAll({ order: [["id_ciclo_pago", "ASC"]] }))
    .map((registro) => ({ id: registro.id_ciclo_pago, ciclo_pago: registro.ciclo_pago }));

export const getCicloPago = async ({ id }) => {
  const cid = requirePositiveInt(id, "id");
  const ciclo = await models.CicloPago.findByPk(cid);
  if (!ciclo) throw new Error(`No existe ciclo de pago con id ${cid}`);
  return { id: ciclo.id_ciclo_pago, ciclo_pago: ciclo.ciclo_pago };
};
