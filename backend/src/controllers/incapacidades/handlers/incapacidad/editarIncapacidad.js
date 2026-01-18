import { Incapacidad, sequelize, TipoIncapacidad } from "../../../../models/index.js";
import { assertNoIncapacityOverlapRange } from "../../../../services/scheduleEngine/incapacityGuard.js";
import {
  computeIncapacityPolicy,
  toIncapacityDbFields,
} from "../../../../services/scheduleEngine/incapacityPolicy.js";

export const editarIncapacidad = async ({
  id_incapacidad,
  id_tipo_incap,
  fecha_inicio,
  fecha_fin,
  observaciones,
}) => {
  const tx = await sequelize.transaction();

  try {
    if (!Number.isFinite(Number(id_incapacidad))) {
      throw new Error("id_incapacidad inválido");
    }

    const row = await Incapacidad.findByPk(Number(id_incapacidad), {
      transaction: tx,
    });
    if (!row) throw new Error("No existe la incapacidad");

    const nextTipo = id_tipo_incap ?? row.id_tipo_incap;
    const nextInicio = fecha_inicio ?? row.fecha_inicio;
    const nextFin = fecha_fin ?? row.fecha_fin;

    const tipo = await TipoIncapacidad.findByPk(Number(nextTipo), {
      attributes: ["id_tipo_incap", "nombre"],
      transaction: tx,
    });
    if (!tipo) throw new Error("No existe el tipo de incapacidad indicado");

    const policy = computeIncapacityPolicy({
      tipoNombre: tipo.nombre,
      fecha_inicio: nextInicio,
      fecha_fin: nextFin,
    });

    await assertNoIncapacityOverlapRange({
      models: { Incapacidad },
      idColaborador: Number(row.id_colaborador),
      fecha_inicio: nextInicio,
      fecha_fin: nextFin,
      excludeId: Number(id_incapacidad),
      transaction: tx,
    });

    const { porcentaje_patrono, porcentaje_ccss } = toIncapacityDbFields(policy);

    await row.update(
      {
        id_tipo_incap: Number(nextTipo),
        fecha_inicio: nextInicio,
        fecha_fin: nextFin,
        porcentaje_patrono,
        porcentaje_ccss,
        observaciones:
          observaciones !== undefined
            ? String(observaciones || "N/A")
            : row.observaciones,
      },
      { transaction: tx }
    );

    await tx.commit();
    return row;
  } catch (error) {
    if (!tx.finished) {
      await tx.rollback();
    }
    throw error;
  }
};
