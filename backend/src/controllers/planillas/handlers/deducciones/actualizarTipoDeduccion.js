import { Op } from "sequelize";
import { sequelize, TipoDeduccion } from "../../../../models/index.js";

const mapTipoDeduccion = (record) => ({
  id: record.id_tipo_deduccion,
  nombre: record.nombre_tipo,
  esProcentaje: record.es_procentaje,
  esMonto: record.es_monto,
  esVoluntaria: record.es_voluntaria,
  fechaUltimoAjuste: record.fecha_ultimo_ajuste,
});

export const actualizarTipoDeduccion = async (
  idTipoDeduccion,
  { nombre, esPorcentaje, esMonto, esVoluntaria, fechaUltimoAjuste }
) => {
  const tx = await sequelize.transaction();
  try {
    const tipoDeduccion = await TipoDeduccion.findByPk(idTipoDeduccion, { transaction: tx });

    if (!tipoDeduccion) {
      throw new Error(`No existe un tipo de deducción con id "${idTipoDeduccion}"`);
    }

    const updateData = {};

    if (nombre !== undefined) {
      const nombreNormalizado = String(nombre).trim().toUpperCase();
      const nombreActual = String(tipoDeduccion.nombre_tipo).trim().toUpperCase();

      if (nombreNormalizado !== nombreActual) {
        const whereNombre = sequelize.where(
          sequelize.fn("UPPER", sequelize.col("nombre_tipo")),
          nombreNormalizado
        );

        const conflicto = await TipoDeduccion.findOne({
          where: {
            [Op.and]: [whereNombre, { id_tipo_deduccion: { [Op.ne]: idTipoDeduccion } }],
          },
          transaction: tx,
        });

        if (conflicto) {
          throw new Error(`Ya existe un tipo de deducción con nombre "${nombreNormalizado}"`);
        }
      }

      updateData.nombre_tipo = nombreNormalizado;
    }

    if (esPorcentaje !== undefined) {
      updateData.es_procentaje = esPorcentaje;
    }

    if (esMonto !== undefined) {
      updateData.es_monto = esMonto;
    }

    if (esVoluntaria !== undefined) {
      updateData.es_voluntaria = esVoluntaria;
    }

    if (fechaUltimoAjuste !== undefined) {
      updateData.fecha_ultimo_ajuste = fechaUltimoAjuste;
    }

    if (Object.keys(updateData).length === 0) {
      await tx.commit();
      return mapTipoDeduccion(tipoDeduccion);
    }

    await tipoDeduccion.update(updateData, { transaction: tx });
    await tx.commit();

    return mapTipoDeduccion(tipoDeduccion);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};