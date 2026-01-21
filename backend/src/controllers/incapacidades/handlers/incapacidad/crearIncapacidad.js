import { Incapacidad, TipoIncapacidad, sequelize } from "../../../../models/index.js";
import { assertNoIncapacityOverlapRange } from "../../../../services/scheduleEngine/incapacityGuard.js";
import {
  computeIncapacityPolicy,
  toIncapacityDbFields,
} from "../../../../services/scheduleEngine/incapacityPolicy.js";

export const crearIncapacidad = async ({
  id_colaborador,
  tipo_incap,
  fecha_inicio,
  fecha_fin,
  observaciones = "N/A",
}) => {
  const tx = await sequelize.transaction();

  try {
    if (!Number.isFinite(Number(id_colaborador))) {
      throw new Error("id_colaborador es requerido y debe ser numérico");
    }
    if (!tipo_incap || tipo_incap === "") {
      throw new Error("tipo de incapacidad es requerido");
    }

    const tipo = await TipoIncapacidad.findOne({
      where: {
        nombre: String(tipo_incap ?? "").trim().toUpperCase(),
      },
      attributes: ["id_tipo_incap", "nombre"],
      transaction: tx,
    });

    if (!tipo) throw new Error("No existe el tipo de incapacidad indicado");

    // Validación de fechas + cálculo de policy (formato YYYY-MM-DD, rango válido, etc.)
    const policy = computeIncapacityPolicy({
      tipoNombre: tipo.nombre,
      fecha_inicio,
      fecha_fin,
    });

    await assertNoIncapacityOverlapRange({
      models: { Incapacidad },
      idColaborador: Number(id_colaborador),
      fecha_inicio,
      fecha_fin,
      transaction: tx,
    });

    const { porcentaje_patrono, porcentaje_ccss } = toIncapacityDbFields(policy);

    const row = await Incapacidad.create(
      {
        id_colaborador: Number(id_colaborador),
        id_tipo_incap: Number(tipo.id_tipo_incap),
        fecha_inicio,
        fecha_fin,
        porcentaje_patrono,
        porcentaje_ccss,
        observaciones: String(observaciones || "N/A"),
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
