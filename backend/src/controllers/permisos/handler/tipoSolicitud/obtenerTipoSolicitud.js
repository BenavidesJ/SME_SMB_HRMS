// import { TipoSolicitud } from "../../../../models/index.js";

// /**
//  * Obtiene un tipo de solicitud por ID
//  * 
//  * @param {{ id_tipo_solicitud: number|string }} payload
//  * @returns {Promise<{id:number, tipo_solicitud:string, es_licencia:boolean, es_permiso:boolean}>}
//  */
// export const obtenerTipoSolicitud = async ({ id_tipo_solicitud }) => {
//   const id = Number(String(id_tipo_solicitud).trim());
//   if (!Number.isFinite(id)) {
//     throw new Error("id_tipo_solicitud debe ser numérico");
//   }

//   const row = await TipoSolicitud.findByPk(id);
  
//   if (!row) {
//     throw new Error(`No existe el tipo de solicitud con id ${id}`);
//   }

//   return {
//     id: row.id_tipo_solicitud,
//     tipo_solicitud: row.tipo_solicitud,
//     es_licencia: row.es_licencia,
//     es_permiso: row.es_permiso,
//   };
// };