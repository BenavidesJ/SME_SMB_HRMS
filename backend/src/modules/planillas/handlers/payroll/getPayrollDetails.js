import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import {
  requirePositiveInt,
} from "../../../mantenimientos_consultas/shared/validators.js";
import { serializePlanilla, roundCurrency } from "../../shared/formatters.js";

const { Planilla } = models;

export const obtenerDetallePlanilla = async ({ id_periodo, colaboradores }) => {
  const periodoId = requirePositiveInt(id_periodo, "id_periodo");
  if (!Array.isArray(colaboradores) || colaboradores.length === 0) {
    throw new Error("Debe indicar al menos un colaborador");
  }
  const ids = colaboradores.map((value) => requirePositiveInt(value, "colaboradores"));

  const registros = await Planilla.findAll({
    where: {
      id_periodo: periodoId,
      id_colaborador: { [Op.in]: ids },
    },
    order: [["id_colaborador", "ASC"]],
  });

  const detalles = registros.map((detalle) =>
    serializePlanilla({ ...detalle.get({ plain: true }), generado_por: null })
  );

  const total = roundCurrency(detalles.reduce((acc, item) => acc + Number(item.neto ?? 0), 0));

  return {
    id_periodo: periodoId,
    total,
    detalles,
  };
};
