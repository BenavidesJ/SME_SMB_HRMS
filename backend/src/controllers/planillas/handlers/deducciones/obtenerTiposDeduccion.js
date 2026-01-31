import { TipoDeduccion } from "../../../../models/index.js";

const mapTipoDeduccion = (record) => ({
  id: record.id_tipo_deduccion,
  nombre: record.nombre_tipo,
  esProcentaje: record.es_procentaje,
  esMonto: record.es_monto,
  esVoluntaria: record.es_voluntaria,
  fechaUltimoAjuste: record.fecha_ultimo_ajuste,
});

export const obtenerTiposDeduccion = async () => {
  const tipos = await TipoDeduccion.findAll({
    order: [["nombre_tipo", "ASC"]],
  });

  return tipos.map(mapTipoDeduccion);
};