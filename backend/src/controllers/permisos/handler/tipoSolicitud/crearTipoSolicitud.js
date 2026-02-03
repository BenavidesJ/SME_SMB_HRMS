// import { sequelize, TipoSolicitud } from "../../../../models/index.js";

// /**
//  * Crea un nuevo tipo de solicitud
//  * 
//  * @param {{
//  *   tipo_solicitud: string,
//  *   es_licencia?: boolean,
//  *   es_permiso?: boolean
//  * }} payload
//  * @returns {Promise<{id:number, tipo_solicitud:string, es_licencia:boolean, es_permiso:boolean}>}
//  */
// export const crearTipoSolicitud = async ({ tipo_solicitud, es_licencia, es_permiso }) => {
//   const tx = await sequelize.transaction();
  
//   try {
//     const nombre = String(tipo_solicitud).trim().toUpperCase();
//     if (!nombre) {
//       throw new Error("tipo_solicitud no puede ser vacío");
//     }

//     if (nombre.length > 15) {
//       throw new Error("tipo_solicitud no puede exceder 15 caracteres");
//     }

//     const esLicencia = Boolean(es_licencia);
//     const esPermiso = Boolean(es_permiso);

//     if (esLicencia && esPermiso) {
//       throw new Error("Un tipo de solicitud no puede ser licencia y permiso simultáneamente");
//     }

//     const exists = await TipoSolicitud.findOne({
//       where: sequelize.where(
//         sequelize.fn("UPPER", sequelize.col("tipo_solicitud")),
//         nombre,
//       ),
//       transaction: tx,
//     });

//     if (exists) {
//       throw new Error(`Ya existe un tipo de solicitud con nombre "${nombre}"`);
//     }

//     const created = await TipoSolicitud.create(
//       {
//         tipo_solicitud: nombre,
//         es_licencia: esLicencia,
//         es_permiso: esPermiso,
//       },
//       { transaction: tx },
//     );

//     await tx.commit();

//     return {
//       id: created.id_tipo_solicitud,
//       tipo_solicitud: created.tipo_solicitud,
//       es_licencia: created.es_licencia,
//       es_permiso: created.es_permiso,
//     };
//   } catch (error) {
//     if (!tx.finished) await tx.rollback();
//     throw error;
//   }
// };