import { Op } from "sequelize";
import { Aguinaldo, Colaborador, sequelize } from "../../../models/index.js";
import {
  assertValidDateRange,
  normalizeDateOnly,
  normalizeYear,
  parseAguinaldoPeriodoKey,
} from "../utils/periodoKey.js";
import { summarizePeriodoRecords } from "./shared/periodos.js";

const ALLOWED_FIELDS = new Set(["anio", "periodo_desde", "periodo_hasta", "fecha_pago"]);

function buildWhereFromPeriodo(periodo) {
  return {
    anio: periodo.anio,
    periodo_desde: periodo.periodo_desde,
    periodo_hasta: periodo.periodo_hasta,
    fecha_pago: periodo.fecha_pago,
  };
}

function sanitizePatch(patch) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    throw new Error("Debe enviar un payload valido para editar el periodo");
  }

  const patchKeys = Object.keys(patch);
  if (patchKeys.length === 0) {
    throw new Error("Debe indicar al menos un campo para editar el periodo");
  }

  for (const key of patchKeys) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new Error(`El campo ${key} no se puede editar`);
    }
  }

  return patch;
}

export async function editarPeriodoAguinaldo({ periodoKey, patch } = {}) {
  const currentPeriodo = parseAguinaldoPeriodoKey(periodoKey);
  const cleanPatch = sanitizePatch(patch);

  return sequelize.transaction(async (transaction) => {
    const currentWhere = buildWhereFromPeriodo(currentPeriodo);

    const periodRecords = await Aguinaldo.findAll({
      where: currentWhere,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (periodRecords.length === 0) {
      throw new Error("No existe el periodo de aguinaldo seleccionado");
    }

    const nextPeriodo = {
      anio: cleanPatch.anio !== undefined
        ? normalizeYear(cleanPatch.anio)
        : currentPeriodo.anio,
      periodo_desde: cleanPatch.periodo_desde !== undefined
        ? normalizeDateOnly(cleanPatch.periodo_desde, "periodo_desde")
        : currentPeriodo.periodo_desde,
      periodo_hasta: cleanPatch.periodo_hasta !== undefined
        ? normalizeDateOnly(cleanPatch.periodo_hasta, "periodo_hasta")
        : currentPeriodo.periodo_hasta,
      fecha_pago: cleanPatch.fecha_pago !== undefined
        ? normalizeDateOnly(cleanPatch.fecha_pago, "fecha_pago")
        : currentPeriodo.fecha_pago,
    };

    assertValidDateRange(nextPeriodo.periodo_desde, nextPeriodo.periodo_hasta);

    const recordIds = periodRecords.map((record) => Number(record.id_aguinaldo));
    const collaboratorIds = Array.from(
      new Set(periodRecords.map((record) => Number(record.id_colaborador))),
    );

    const conflicts = await Aguinaldo.findAll({
      where: {
        id_aguinaldo: { [Op.notIn]: recordIds },
        id_colaborador: { [Op.in]: collaboratorIds },
        anio: nextPeriodo.anio,
      },
      include: [
        {
          model: Colaborador,
          as: "colaborador",
          attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        },
      ],
      transaction,
    });

    if (conflicts.length > 0) {
      const conflictedCollaborators = conflicts.map((record) => {
        const collaborator = record.colaborador;
        return {
          id_colaborador: Number(record.id_colaborador),
          nombre_completo: collaborator
            ? [
                collaborator.nombre,
                collaborator.primer_apellido,
                collaborator.segundo_apellido,
              ].filter(Boolean).join(" ")
            : `Colaborador #${record.id_colaborador}`,
        };
      });

      const error = new Error(
        `No se puede cambiar el periodo porque ${conflictedCollaborators.length} colaborador(es) ya tienen aguinaldo en el anio ${nextPeriodo.anio}`,
      );
      error.statusCode = 409;
      error.data = { conflictos: conflictedCollaborators };
      throw error;
    }

    await Aguinaldo.update(nextPeriodo, {
      where: { id_aguinaldo: { [Op.in]: recordIds } },
      transaction,
    });

    const refreshedRecords = await Aguinaldo.findAll({
      where: buildWhereFromPeriodo(nextPeriodo),
      include: [
        {
          model: Colaborador,
          as: "registradoPor",
          attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
        },
      ],
      transaction,
    });

    return summarizePeriodoRecords(refreshedRecords);
  });
}