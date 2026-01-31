import { sequelize, TipoDeduccion } from "../../../../models/index.js";

const mapTipoDeduccion = (record) => ({
  id: record.id_tipo_deduccion,
  nombre: record.nombre_tipo,
  esProcentaje: record.es_procentaje,
  esMonto: record.es_monto,
  esVoluntaria: record.es_voluntaria,
  fechaUltimoAjuste: record.fecha_ultimo_ajuste,
});

export const eliminarTipoDeduccion = async (idTipoDeduccion) => {
  const tx = await sequelize.transaction();
  try {
    const tipoDeduccion = await TipoDeduccion.findByPk(idTipoDeduccion, { transaction: tx });

    if (!tipoDeduccion) {
      throw new Error(`No existe un tipo de deducción con id "${idTipoDeduccion}"`);
    }

    await tipoDeduccion.destroy({ transaction: tx });
    await tx.commit();

    return mapTipoDeduccion(tipoDeduccion);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};