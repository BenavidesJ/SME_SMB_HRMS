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
 * Crear Horario Laboral
 *
 * @param {{
 *   id_contrato: number,
 *   hora_inicio: string,
 *   hora_fin: string,
 *   minutos_descanso?: number,
 *   dias_laborales?: string,
 *   dias_libres?: string,
 *   tipo_jornada: string,
 *   estado: string
 * }} payload
 *
 * @returns {Promise<object>}
 */
export const crearHorarioLaboral = async ({
  id_contrato,
  hora_inicio,
  hora_fin,
  minutos_descanso,
  dias_laborales,
  dias_libres,
  tipo_jornada,
  estado,
}) => {
  const tx = await sequelize.transaction();

  try {
    const required = {
      id_contrato,
      hora_inicio,
      hora_fin,
      tipo_jornada,
      estado,
    };

    for (const [field, value] of Object.entries(required)) {
      if (value === undefined || value === null || String(value).trim() === "") {
        throw new Error(`El campo ${field} es obligatorio`);
      }
    }

    const contratoId = Number(id_contrato);
    if (!Number.isInteger(contratoId) || contratoId <= 0) {
      throw new Error("id_contrato debe ser un número entero válido");
    }

    const contrato = await Contrato.findByPk(contratoId, { transaction: tx });
    if (!contrato) throw new Error(`No existe un contrato con id ${contratoId}`);

    const estadoTxt = String(estado).trim().toUpperCase();
    const estadoDb = await Estado.findOne({
      where: { estado: estadoTxt },
      attributes: ["id_estado", "estado"],
      transaction: tx,
    });
    if (!estadoDb) throw new Error(`No existe un estado: ${estado}`);

    const jornadaTxt = String(tipo_jornada).trim().toUpperCase();
    const tipoJornadaDb = await TipoJornada.findOne({
      where: { tipo: jornadaTxt },
      attributes: ["id_tipo_jornada", "tipo"],
      transaction: tx,
    });
    if (!tipoJornadaDb) throw new Error(`No existe un tipo de jornada: ${tipo_jornada}`);

    const inicio = normalizeTime(hora_inicio, "hora_inicio");
    const fin = normalizeTime(hora_fin, "hora_fin");

    if (inicio === fin) {
      throw new Error("hora_inicio y hora_fin no pueden ser iguales");
    }

    const descanso =
      minutos_descanso === undefined || minutos_descanso === null || String(minutos_descanso).trim() === ""
        ? 0
        : Number(minutos_descanso);

    if (!Number.isInteger(descanso) || descanso < 0) {
      throw new Error("minutos_descanso debe ser un entero mayor o igual a 0");
    }
    if (descanso > 600) {
      throw new Error("minutos_descanso es demasiado alto (máx sugerido 600)");
    }

    const laborales = normalizeDays(dias_laborales, "dias_laborales", {
      defaultValue: "LKMJV",
    });
    const libres = normalizeDays(dias_libres, "dias_libres", {
      defaultValue: "SD",
    });

    if (!setsAreDisjoint(laborales, libres)) {
      throw new Error("dias_laborales y dias_libres no pueden contener los mismos días");
    }

    const fechaActualizacion = dayjs().format("YYYY-MM-DD");

    const nuevo = await HorarioLaboral.create(
      {
        id_contrato: contratoId,
        hora_inicio: inicio,
        hora_fin: fin,
        minutos_descanso: descanso,
        dias_laborales: laborales,
        dias_libres: libres,
        estado: estadoDb.id_estado,
        fecha_actualizacion: fechaActualizacion,
        id_tipo_jornada: tipoJornadaDb.id_tipo_jornada,
      },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id: nuevo.id_horario,
      id_contrato: nuevo.id_contrato,
      hora_inicio: nuevo.hora_inicio,
      hora_fin: nuevo.hora_fin,
      minutos_descanso: nuevo.minutos_descanso,
      dias_laborales: nuevo.dias_laborales,
      dias_libres: nuevo.dias_libres,
      estado: estadoDb.estado,
      fecha_actualizacion: nuevo.fecha_actualizacion,
      tipo_jornada: tipoJornadaDb.tipo,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
