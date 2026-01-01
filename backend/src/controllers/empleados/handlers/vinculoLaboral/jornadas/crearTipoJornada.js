import { normalizeDecimal } from "../../../../../common/normalizeDecimal.js";
import { sequelize, TipoJornada } from "../../../../../models/index.js";

/**
 * Crear Tipo Jornada
 * 
 * @param {String} { 
 *      tipo,
 *      max_horas_diarias,
 *      max_horas_semanales 
 *  }
 * @returns {Promise<object>}
 */
export const crearNuevoTipoJornada = async (
  {
    tipo,
    max_horas_diarias,
    max_horas_semanales
  }) => {

  const tx = await sequelize.transaction();

  try {

    const max_horas_dia = normalizeDecimal(
      max_horas_diarias,
      { precision: 4, scale: 2, fieldName: "max_horas_diarias" }
    )

    const max_horas_sem = normalizeDecimal(
      max_horas_semanales,
      { precision: 5, scale: 2, fieldName: "max_horas_semanales" }
    )

    const exists = await TipoJornada.findOne({
      where: { tipo },
      transaction: tx
    });

    if (exists) throw new Error(`Ya existe un tipo de jornada: ${tipo}`)

    const scheduleTypeValue = tipo?.trim().toUpperCase();

    const newScheduleType = await TipoJornada.create({
      tipo: scheduleTypeValue,
      max_horas_diarias: max_horas_dia,
      max_horas_semanales: max_horas_sem
    }, { transaction: tx });

    await tx.commit();


    return {
      id: newScheduleType.id_tipo_jornada,
      tipo_jornada: newScheduleType.tipo,
      cantidad_max_horas_dia: newScheduleType.max_horas_diarias,
      cantidad_max_horas_semana: newScheduleType.max_horas_semanales,
    };

  } catch (error) {
    await tx.rollback();
    throw error;
  }
};