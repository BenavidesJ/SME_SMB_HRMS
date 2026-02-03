// import { sequelize, TipoSolicitud, SolicitudPermisosLicencias } from "../../../../models/index.js";

// /**
//  * Eliminar Tipo de Solicitud
//  * 
//  * @param {{ id_tipo_solicitud: number|string }} payload
//  * @returns {Promise<{id:number, deleted:boolean}>}
//  */
// export const eliminarTipoSolicitud = async ({ id_tipo_solicitud }) => {
//   const tx = await sequelize.transaction();

//   try {
//     const id = Number(String(id_tipo_solicitud).trim());
//     if (!Number.isFinite(id)) {
//       throw new Error("id_tipo_solicitud debe ser numérico");
//     }

//     const current = await TipoSolicitud.findByPk(id, {
//       attributes: ["id_tipo_solicitud", "tipo_solicitud"],
//       transaction: tx,
//     });

//     if (!current) {
//       throw new Error(`No existe tipo de solicitud con id ${id}`);
//     }

//     // Verificar si el tipo está en uso en alguna solicitud
//     const enUso = await SolicitudPermisosLicencias.findOne({
//       where: { tipo_solicitud: id },
//       attributes: ["tipo_solicitud"],
//       transaction: tx,
//     });

//     if (enUso) {
//       const err = new Error(
//         `No se puede eliminar el tipo de solicitud "${current.tipo_solicitud}" porque está en uso`
//       );
//       err.statusCode = 409;
//       throw err;
//     }

//     await current.destroy({ transaction: tx });

//     await tx.commit();
//     return { id, deleted: true };
//   } catch (error) {
//     if (!tx.finished) await tx.rollback();
//     throw error;
//   }
// };