import {
  sequelize,
  HorarioLaboral,
  Contrato,
  TipoJornada,
  Estado,
} from "../../../../../../models/index.js";
import dayjs from "dayjs";
import { normalizeTime } from "../helpers/normalizeTime.js";
import { normalizeDays } from "../helpers/normalizeDays.js";
import { setsAreDisjoint } from "../helpers/checkSetsDisjoint.js";

/**
 * Modificar Horario Laboral
 *
 * @param {{
 *   id_horario: number|string,
 *   patch: {
 *     id_contrato?: number|string,
 *     hora_inicio?: string,
 *     hora_fin?: string,
 *     minutos_descanso?: number|string|null,
 *     dias_laborales?: string,
 *     dias_libres?: string,
 *     tipo_jornada?: string,
 *     estado?: string|number
 *   }
 * }} params
 *
 * @returns {Promise<object>}
 */
export const modificarHorarioLaboral = async ({ id_horario, patch = {} }) => {
  const tx = await sequelize.transaction();

  try {
    if (id_horario === undefined || id_horario === null || String(id_horario).trim() === "") {
      throw new Error("El campo id_horario es obligatorio");
    }

    if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
      throw new Error("El formato del body es inválido");
    }

    const allowedFields = new Set([
      "id_contrato",
      "hora_inicio",
      "hora_fin",
      "minutos_descanso",
      "dias_laborales",
      "dias_libres",
      "tipo_jornada",
      "estado",
    ]);

    const patchKeys = Object.keys(patch);
    if (patchKeys.length === 0) {
      throw new Error("No se enviaron campos para actualizar");
    }

    for (const key of patchKeys) {
      if (!allowedFields.has(key)) {
        throw new Error(`Campo no permitido en el body: ${key}`);
      }
    }

    const id = Number(id_horario);
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("id_horario debe ser un número entero válido");
    }

    const current = await HorarioLaboral.findByPk(id, { transaction: tx });
    if (!current) throw new Error(`No existe un horario con id ${id}`);

    const updates = {};


    if (patch.id_contrato !== undefined) {
      const contratoId = Number(patch.id_contrato);
      if (!Number.isInteger(contratoId) || contratoId <= 0) {
        throw new Error("id_contrato debe ser un número entero válido");
      }
      const contrato = await Contrato.findByPk(contratoId, { transaction: tx });
      if (!contrato) throw new Error(`No existe un contrato con id ${contratoId}`);
      updates.id_contrato = contratoId;
    }

    // -----------------------------
    // estado (acepta texto o id)
    // -----------------------------
    if (patch.estado !== undefined) {
      let newEstadoId = null;

      const maybeNum = Number(String(patch.estado).trim());
      if (Number.isFinite(maybeNum) && String(patch.estado).trim() !== "") {
        const st = await Estado.findByPk(maybeNum, { transaction: tx });
        if (!st) throw new Error(`No existe el estado con id ${maybeNum}`);
        newEstadoId = st.id_estado;
      } else {
        const estadoTxt = String(patch.estado).trim().toUpperCase();
        if (!estadoTxt) throw new Error("estado no puede ser vacío");

        const estadoDb = await Estado.findOne({
          where: { estado: estadoTxt },
          attributes: ["id_estado", "estado"],
          transaction: tx,
        });
        if (!estadoDb) throw new Error(`No existe un estado: ${patch.estado}`);
        newEstadoId = estadoDb.id_estado;
      }

      updates.estado = newEstadoId;
    }

    if (patch.tipo_jornada !== undefined) {
      const jornadaTxt = String(patch.tipo_jornada).trim().toUpperCase();
      if (!jornadaTxt) throw new Error("tipo_jornada no puede ser vacío");

      const tipoJornadaDb = await TipoJornada.findOne({
        where: { tipo: jornadaTxt },
        attributes: ["id_tipo_jornada", "tipo"],
        transaction: tx,
      });

      if (!tipoJornadaDb) {
        throw new Error(`No existe un tipo de jornada: ${patch.tipo_jornada}`);
      }
      updates.id_tipo_jornada = tipoJornadaDb.id_tipo_jornada;
    }


    if (patch.hora_inicio !== undefined) {
      updates.hora_inicio = normalizeTime(patch.hora_inicio, "hora_inicio");
    }
    if (patch.hora_fin !== undefined) {
      updates.hora_fin = normalizeTime(patch.hora_fin, "hora_fin");
    }


    if (patch.minutos_descanso !== undefined) {
      const descansoRaw =
        patch.minutos_descanso === null || String(patch.minutos_descanso).trim() === ""
          ? 0
          : Number(patch.minutos_descanso);

      if (!Number.isInteger(descansoRaw) || descansoRaw < 0) {
        throw new Error("minutos_descanso debe ser un entero mayor o igual a 0");
      }
      if (descansoRaw > 600) {
        throw new Error("minutos_descanso es demasiado alto (máx sugerido 600)");
      }

      updates.minutos_descanso = descansoRaw;
    }

    // -----------------------------
    // días
    // -----------------------------
    if (patch.dias_laborales !== undefined) {
      updates.dias_laborales = normalizeDays(patch.dias_laborales, "dias_laborales", {
        defaultValue: current.dias_laborales,
      });
    }
    if (patch.dias_libres !== undefined) {
      updates.dias_libres = normalizeDays(patch.dias_libres, "dias_libres", {
        defaultValue: current.dias_libres,
      });
    }

    // -----------------------------
    // Validaciones cruzadas (tomando final values)
    // -----------------------------
    const finalInicio = updates.hora_inicio ?? current.hora_inicio;
    const finalFin = updates.hora_fin ?? current.hora_fin;

    if (finalInicio === finalFin) {
      throw new Error("hora_inicio y hora_fin no pueden ser iguales");
    }

    const finalLaborales = updates.dias_laborales ?? current.dias_laborales;
    const finalLibres = updates.dias_libres ?? current.dias_libres;

    if (!setsAreDisjoint(finalLaborales, finalLibres)) {
      throw new Error("dias_laborales y dias_libres no pueden contener los mismos días");
    }

    if (Object.keys(updates).length === 0) {
      throw new Error("No hay cambios efectivos para aplicar");
    }

    updates.fecha_actualizacion = dayjs().format("YYYY-MM-DD");

    await current.update(updates, { transaction: tx });

    const estadoFinal = await Estado.findByPk(current.estado, {
      attributes: ["estado"],
      transaction: tx,
    });

    const tipoJornadaFinal = await TipoJornada.findByPk(current.id_tipo_jornada, {
      attributes: ["tipo"],
      transaction: tx,
    });

    await tx.commit();

    return {
      id: current.id_horario,
      id_contrato: current.id_contrato,
      hora_inicio: current.hora_inicio,
      hora_fin: current.hora_fin,
      minutos_descanso: current.minutos_descanso,
      dias_laborales: current.dias_laborales,
      dias_libres: current.dias_libres,
      estado: estadoFinal?.estado ?? current.estado,
      fecha_actualizacion: current.fecha_actualizacion,
      tipo_jornada: tipoJornadaFinal?.tipo ?? current.id_tipo_jornada,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
