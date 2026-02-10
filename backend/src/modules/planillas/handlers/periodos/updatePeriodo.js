import dayjs from "dayjs";
import { Op } from "sequelize";
import { models, sequelize } from "../../../../models/index.js";
import {
  ensurePatchHasAllowedFields,
  optionalDateOnly,
  requirePositiveInt,
} from "../../../mantenimientos_consultas/shared/validators.js";
import { resolveCicloPago, ensureEstado } from "../../shared/resolvers.js";
import { serializePeriodo } from "../../shared/formatters.js";

const { PeriodoPlanilla } = models;

export const updatePeriodoPlanilla = async ({ id, patch } = {}) => {
  const periodoId = requirePositiveInt(id, "id");
  const allowed = ["fecha_inicio", "fecha_fin", "fecha_pago", "id_ciclo_pago", "ciclo_pago", "estado"];
  ensurePatchHasAllowedFields(patch ?? {}, allowed);

  return sequelize.transaction(async (transaction) => {
    const periodo = await PeriodoPlanilla.findByPk(periodoId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!periodo) throw new Error(`No existe un periodo de planilla con id ${periodoId}`);

    const nextInicio = optionalDateOnly(patch?.fecha_inicio, "fecha_inicio") ?? periodo.fecha_inicio;
    const nextFin = optionalDateOnly(patch?.fecha_fin, "fecha_fin") ?? periodo.fecha_fin;
    const nextPago = optionalDateOnly(patch?.fecha_pago, "fecha_pago") ?? periodo.fecha_pago;

    if (dayjs(nextInicio).isAfter(dayjs(nextFin))) {
      throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
    }

    const cicloInput = patch?.id_ciclo_pago ?? patch?.ciclo_pago;
    const ciclo = cicloInput !== undefined && cicloInput !== null
      ? await resolveCicloPago(cicloInput, transaction)
      : null;

    const estado = patch?.estado ? await ensureEstadoValue(patch.estado, transaction) : null;

    const cicloId = ciclo ? ciclo.id_ciclo_pago : periodo.ciclo_pago;

    await assertNoOverlap({
      inicio: nextInicio,
      fin: nextFin,
      cicloId,
      excludeId: periodoId,
      transaction,
    });

    await periodo.update(
      {
        fecha_inicio: nextInicio,
        fecha_fin: nextFin,
        fecha_pago: nextPago,
        ciclo_pago: cicloId,
        estado: estado ? estado.id_estado : periodo.estado,
      },
      { transaction }
    );

    const refreshed = await PeriodoPlanilla.findByPk(periodoId, {
      include: [{ association: "estadoRef", attributes: ["estado"] }],
      transaction,
    });

    return serializePeriodo(refreshed);
  });
};

async function assertNoOverlap({ inicio, fin, cicloId, excludeId, transaction }) {
  const overlap = await PeriodoPlanilla.count({
    where: {
      id_periodo: { [Op.ne]: excludeId },
      ciclo_pago: cicloId,
      [Op.or]: [
        { fecha_inicio: { [Op.between]: [inicio, fin] } },
        { fecha_fin: { [Op.between]: [inicio, fin] } },
        {
          fecha_inicio: { [Op.lte]: inicio },
          fecha_fin: { [Op.gte]: fin },
        },
      ],
    },
    transaction,
  });

  if (overlap > 0) {
    throw new Error("Ya existe un periodo registrado que se superpone con el rango indicado");
  }
}

async function ensureEstadoValue(value, transaction) {
  if (value === undefined || value === null) return ensureEstado("PENDIENTE", transaction);
  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const estado = await models.Estado.findByPk(requirePositiveInt(value, "estado"), { transaction });
    if (!estado) throw new Error("El estado especificado no existe");
    return estado;
  }
  const estado = await ensureEstado(String(value).trim().toUpperCase(), transaction);
  return estado;
}
