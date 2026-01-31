import { sequelize, TipoDeduccion } from "../../../../models/index.js";

/**
 * Crea un tipo de deduccion
 */
export const crearTipoDeduccion = async ({
  nombre,
  esPorcentaje = true,
  esMonto = false,
  esVoluntaria,
  fechaUltimoAjuste,
}) => {
  const tx = await sequelize.transaction();
  try {
    const nombreNormalizado = String(nombre).trim().toUpperCase();

    const exists = await TipoDeduccion.findOne({
      where: sequelize.where(
        sequelize.fn("UPPER", sequelize.col("nombre_tipo")),
        nombreNormalizado
      ),
      transaction: tx,
    });

    if (exists) {
      throw new Error(`Ya existe un tipo de deducción con nombre "${nombreNormalizado}"`);
    }

    const created = await TipoDeduccion.create(
      {
        nombre_tipo: nombreNormalizado,
        es_procentaje: esPorcentaje,
        es_monto: esMonto,
        es_voluntaria: esVoluntaria,
        fecha_ultimo_ajuste: fechaUltimoAjuste,
      },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id: created.id_tipo_deduccion,
      nombre: created.nombre_tipo,
      esProcentaje: created.es_procentaje,
      esMonto: created.es_monto,
      esVoluntaria: created.es_voluntaria,
      fechaUltimoAjuste: created.fecha_ultimo_ajuste,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
