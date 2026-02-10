import dayjs from "dayjs";
import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../../mantenimientos_consultas/shared/transaction.js";
import { requireDateOnly, requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import { resolveCicloPago, ensureEstado } from "../../shared/resolvers.js";
import { serializePeriodo } from "../../shared/formatters.js";

const { PeriodoPlanilla } = models;

function validateDateOrder(inicio, fin) {
  if (dayjs(inicio).isAfter(dayjs(fin))) {
    throw new Error("La fecha de inicio no puede ser posterior a la fecha de fin");
  }
}

async function assertNoOverlap({ inicio, fin, cicloId, transaction }) {
  const overlapExists = await PeriodoPlanilla.count({
    where: {
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

  if (overlapExists > 0) {
    throw new Error("Ya existe un periodo registrado que se superpone con el rango indicado");
  }
}

export const createPeriodoPlanilla = (payload = {}) =>
  runInTransaction(async (transaction) => {
    const fechaInicio = requireDateOnly(payload.fecha_inicio, "fecha_inicio");
    const fechaFin = requireDateOnly(payload.fecha_fin, "fecha_fin");
    const fechaPago = requireDateOnly(payload.fecha_pago, "fecha_pago");
    const ciclo = await resolveCicloPago(payload.id_ciclo_pago ?? payload.ciclo_pago, transaction);
    const estado = payload.estado
      ? await resolveEstadoInput(payload.estado, transaction)
      : await ensureEstado("PENDIENTE", transaction);

    validateDateOrder(fechaInicio, fechaFin);

    await assertNoOverlap({
      inicio: fechaInicio,
      fin: fechaFin,
      cicloId: ciclo.id_ciclo_pago,
      transaction,
    });

    const created = await PeriodoPlanilla.create(
      {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        fecha_pago: fechaPago,
        ciclo_pago: ciclo.id_ciclo_pago,
        estado: estado.id_estado,
      },
      { transaction }
    );

    const periodWithRefs = await PeriodoPlanilla.findByPk(created.id_periodo, {
      include: [{ association: "estadoRef", attributes: ["estado"] }],
      transaction,
    });

    return serializePeriodo(periodWithRefs);
  });

async function resolveEstadoInput(value, transaction) {
  if (value === undefined || value === null) return ensureEstado("PENDIENTE", transaction);
  if (typeof value === "number" || /^\d+$/.test(String(value))) {
    const id = requirePositiveInt(value, "estado");
    const estado = await models.Estado.findByPk(id, { transaction });
    if (!estado) throw new Error(`No existe estado con id ${id}`);
    return estado;
  }
  const name = String(value).trim().toUpperCase();
  const estado = await models.Estado.findOne({ where: { estado: name }, transaction });
  if (!estado) throw new Error(`No existe estado '${name}'`);
  return estado;
}
