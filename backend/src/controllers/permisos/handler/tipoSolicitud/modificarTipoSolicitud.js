// import { sequelize, TipoSolicitud } from "../../../../models/index.js";

// /**
//  * Actualiza un tipo de solicitud existente
//  * 
//  * @param {{
//  *   id_tipo_solicitud: number|string,
//  *   tipo_solicitud?: string,
//  *   es_licencia?: boolean,
//  *   es_permiso?: boolean
//  * }} payload
//  * @returns {Promise<{id:number, tipo_solicitud:string, es_licencia:boolean, es_permiso:boolean}>}
//  */
// export const modificarTipoSolicitud = async ({
//   id_tipo_solicitud,
//   tipo_solicitud,
//   es_licencia,
//   es_permiso,
// }) => {
//   const tx = await sequelize.transaction();

//   try {
//     const id = Number(String(id_tipo_solicitud).trim());
//     if (!Number.isFinite(id)) {
//       throw new Error("id_tipo_solicitud debe ser numérico");
//     }

//     const current = await TipoSolicitud.findByPk(id, { transaction: tx });
//     if (!current) {
//       throw new Error(`No existe tipo de solicitud con id ${id}`);
//     }

//     const updates = {};
//     if (tipo_solicitud !== undefined) {
//       const nuevoNombre = String(tipo_solicitud).trim().toUpperCase();
      
//       if (!nuevoNombre) {
//         throw new Error("tipo_solicitud no puede ser vacío");
//       }

//       if (nuevoNombre.length > 15) {
//         throw new Error("tipo_solicitud no puede exceder 15 caracteres");
//       }

//       const exists = await TipoSolicitud.findOne({
//         where: sequelize.where(
//           sequelize.fn("UPPER", sequelize.col("tipo_solicitud")),
//           nuevoNombre,
//         ),
//         transaction: tx,
//       });

//       if (exists && exists.id_tipo_solicitud !== id) {
//         throw new Error(`Ya existe un tipo de solicitud: ${nuevoNombre}`);
//       }

//       updates.tipo_solicitud = nuevoNombre;
//     }

//     if (es_licencia !== undefined) {
//       updates.es_licencia = Boolean(es_licencia);
//     }

//     if (es_permiso !== undefined) {
//       updates.es_permiso = Boolean(es_permiso);
//     }

//     if (Object.keys(updates).length === 0) {
//       throw new Error("Debe enviar al menos un campo para actualizar");
//     }

//     const finalLicencia = updates.es_licencia ?? current.es_licencia;
//     const finalPermiso = updates.es_permiso ?? current.es_permiso;
    
//     if (finalLicencia && finalPermiso) {
//       throw new Error("Un tipo de solicitud no puede ser licencia y permiso simultáneamente");
//     }

//     await current.update(updates, { transaction: tx });

//     await tx.commit();

//     return {
//       id: current.id_tipo_solicitud,
//       tipo_solicitud: current.tipo_solicitud,
//       es_licencia: current.es_licencia,
//       es_permiso: current.es_permiso,
//     };
//   } catch (error) {
//     if (!tx.finished) await tx.rollback();
//     throw error;
//   }
// };