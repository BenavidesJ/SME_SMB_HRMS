import { Aguinaldo, Colaborador, sequelize } from "../../../models/index.js";

/**
 * Crear Aguinaldo
 * 
 * @param {Object} params - Parámetros para crear el aguinaldo
 * @param {Number} params.id_colaborador - ID del colaborador
 * @param {Number} params.anio - Año del aguinaldo
 * @param {String} params.periodo_desde - Fecha de inicio del período (YYYY-MM-DD)
 * @param {String} params.periodo_hasta - Fecha de fin del período (YYYY-MM-DD)
 * @param {Number} params.monto_calculado - Monto calculado del aguinaldo
 * @param {String} params.fecha_pago - Fecha de pago del aguinaldo (YYYY-MM-DD)
 * @param {Number} params.registrado_por - ID del usuario que registra
 * @returns {Promise<Object>} - Aguinaldo creado
 */
export const crearNuevoAguinaldo = async ({
  id_colaborador,
  anio,
  periodo_desde,
  periodo_hasta,
  monto_calculado,
  fecha_pago,
  registrado_por,
}) => {
  const tx = await sequelize.transaction();

  try {
    const colaborador = await Colaborador.findByPk(Number(id_colaborador));

    if (!colaborador) {
      throw new Error(`No existe un colaborador con el id: ${id_colaborador}`);
    }

    const aguinaldoExistente = await Aguinaldo.findOne({
      where: {
        id_colaborador: Number(id_colaborador),
        anio: Number(anio),
      },
    });

    if (aguinaldoExistente) {
      throw new Error(
        `Ya existe un aguinaldo registrado para el colaborador ${id_colaborador} en el año ${anio}`
      );
    }

    const aguinaldo = await Aguinaldo.create(
      {
        id_colaborador: Number(id_colaborador),
        anio: Number(anio),
        periodo_desde,
        periodo_hasta,
        monto_calculado: Number(monto_calculado),
        fecha_pago,
        registrado_por: Number(registrado_por),
      },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id_aguinaldo: aguinaldo.id_aguinaldo,
      id_colaborador: aguinaldo.id_colaborador,
      anio: aguinaldo.anio,
      monto_calculado: aguinaldo.monto_calculado,
      fecha_pago: aguinaldo.fecha_pago,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};