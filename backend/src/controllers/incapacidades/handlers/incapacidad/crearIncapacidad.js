import dayjs from "dayjs";
import { Incapacidad, TipoIncapacidad, sequelize } from "../../../../models/index.js";
import { assertNoIncapacityOverlapRange } from "../../../../services/scheduleEngine/incapacityGuard.js";
import {
  computeIncapacityPolicy,
  toIncapacityDbFields,
} from "../../../../services/scheduleEngine/incapacityPolicy.js";

/**
 * Crea una incapacidad.
 *
 * - Si existe una incapacidad del mismo tipo que traslapa o es contigua al nuevo rango,
 *   se fusiona en un único evento y se eliminan duplicados.
 *
 * - Si existe una incapacidad de tipo diferente que traslapa o es contigua al nuevo rango,
 *   se bloquea para evitar eventos mezclados.
 */
export const crearIncapacidad = async ({
  id_colaborador,
  tipo_incap,
  fecha_inicio,
  fecha_fin,
  observaciones = "N/A",
}) => {
  const tx = await sequelize.transaction();

  try {
    const idCol = Number(id_colaborador);
    if (!Number.isFinite(idCol)) {
      throw new Error("id_colaborador es requerido y debe ser numérico");
    }

    const tipoTxt = String(tipo_incap ?? "").trim().toUpperCase();
    if (!tipoTxt) {
      throw new Error("tipo de incapacidad es requerido");
    }

    const tipo = await TipoIncapacidad.findOne({
      where: { nombre: tipoTxt },
      attributes: ["id_tipo_incap", "nombre"],
      transaction: tx,
    });
    if (!tipo) throw new Error("No existe el tipo de incapacidad indicado");

    const start = dayjs(String(fecha_inicio), "YYYY-MM-DD", true);
    const end = dayjs(String(fecha_fin), "YYYY-MM-DD", true);
    if (!start.isValid()) throw new Error("fecha_inicio debe tener formato YYYY-MM-DD");
    if (!end.isValid()) throw new Error("fecha_fin debe tener formato YYYY-MM-DD");
    if (end.isBefore(start)) throw new Error("fecha_fin no puede ser menor que fecha_inicio");

    const startStr = start.format("YYYY-MM-DD");
    const endStr = end.format("YYYY-MM-DD");

    const startMinus1 = start.subtract(1, "day").format("YYYY-MM-DD");
    const endPlus1 = end.add(1, "day").format("YYYY-MM-DD");

    const candidates = await Incapacidad.findAll({
      where: {
        id_colaborador: idCol,
        fecha_inicio: { [sequelize.Sequelize.Op.lte]: endPlus1 },
        fecha_fin: { [sequelize.Sequelize.Op.gte]: startMinus1 },
      },
      include: [
        {
          model: TipoIncapacidad,
          attributes: ["id_tipo_incap", "nombre"],
          required: false,
        },
      ],
      order: [["fecha_inicio", "ASC"]],
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (candidates.length > 0) {
      const differentType = candidates.find((c) => {
        const t = String(c?.tipoIncapacidad?.nombre ?? "").toUpperCase();
        return t && t !== tipoTxt;
      });

      if (differentType) {
        throw new Error(
          `BLOQUEADO_POR_INCAPACIDAD: existe una incapacidad cercana/traslapada de tipo distinto (${String(
            differentType?.tipoIncapacidad?.nombre ?? "DESCONOCIDO"
          )})`
        );
      }

      const mergedStart = candidates.reduce((min, c) => {
        const d = dayjs(String(c.fecha_inicio), "YYYY-MM-DD", true);
        return d.isBefore(min) ? d : min;
      }, start);

      const mergedEnd = candidates.reduce((max, c) => {
        const d = dayjs(String(c.fecha_fin), "YYYY-MM-DD", true);
        return d.isAfter(max) ? d : max;
      }, end);

      const finalStart = mergedStart.isBefore(start) ? mergedStart : start;
      const finalEnd = mergedEnd.isAfter(end) ? mergedEnd : end;

      const finalStartStr = finalStart.format("YYYY-MM-DD");
      const finalEndStr = finalEnd.format("YYYY-MM-DD");

      const primary = candidates[0];
      const others = candidates.slice(1);

      const policy = computeIncapacityPolicy({
        tipoNombre: tipo.nombre,
        fecha_inicio: finalStartStr,
        fecha_fin: finalEndStr,
      });

      const { porcentaje_patrono, porcentaje_ccss } = toIncapacityDbFields(policy);

      const mergedObsParts = [
        String(primary.observaciones ?? "").trim(),
        String(observaciones ?? "").trim(),
        `FUSION_EPISODIO: ${startStr}..${endStr} => ${finalStartStr}..${finalEndStr}`,
      ].filter(Boolean);

      await primary.update(
        {
          id_tipo_incap: Number(tipo.id_tipo_incap),
          fecha_inicio: finalStartStr,
          fecha_fin: finalEndStr,
          porcentaje_patrono,
          porcentaje_ccss,
          observaciones: mergedObsParts.join(" | ").slice(0, 500),
        },
        { transaction: tx }
      );

      for (const o of others) {
        await o.destroy({ transaction: tx });
      }

      await tx.commit();
      return primary;
    }

    await assertNoIncapacityOverlapRange({
      models: { Incapacidad },
      idColaborador: idCol,
      fecha_inicio: startStr,
      fecha_fin: endStr,
      transaction: tx,
    });

    const policy = computeIncapacityPolicy({
      tipoNombre: tipo.nombre,
      fecha_inicio: startStr,
      fecha_fin: endStr,
    });

    const { porcentaje_patrono, porcentaje_ccss } = toIncapacityDbFields(policy);

    const row = await Incapacidad.create(
      {
        id_colaborador: idCol,
        id_tipo_incap: Number(tipo.id_tipo_incap),
        fecha_inicio: startStr,
        fecha_fin: endStr,
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
