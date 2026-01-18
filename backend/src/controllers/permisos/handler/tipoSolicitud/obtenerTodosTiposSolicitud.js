import { TipoSolicitud } from "../../../../models/index.js";

/**
 * Lista todos los tipos de solicitud
 * 
 * @returns {Promise<Array<{id:number, tipo_solicitud:string, es_licencia:boolean, es_permiso:boolean}>>}
 */
export const obtenerTodosTiposSolicitud = async () => {
  const rows = await TipoSolicitud.findAll({
    order: [["id_tipo_solicitud", "ASC"]],
  });

  return rows.map((r) => ({
    id: r.id_tipo_solicitud,
    tipo_solicitud: r.tipo_solicitud,
    es_licencia: r.es_licencia,
    es_permiso: r.es_permiso,
  }));
};