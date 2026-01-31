import { TipoDeduccion } from "../../../../models/index.js";

const mapTipoDeduccion = (record) => ({
  id: record.id_tipo_deduccion,
  nombre: record.nombre_tipo,
  esProcentaje: record.es_procentaje,
  esMonto: record.es_monto,
  esVoluntaria: record.es_voluntaria,
  fechaUltimoAjuste: record.fecha_ultimo_ajuste,
});

export const obtenerTipoDeduccionPorId = async (idTipoDeduccion) => {
  const tipoDeduccion = await TipoDeduccion.findByPk(idTipoDeduccion);

  if (!tipoDeduccion) {
    throw new Error(`No existe un tipo de deducción con id "${idTipoDeduccion}"`);
  }

  return mapTipoDeduccion(tipoDeduccion);
};