// import { Op } from "sequelize";
// import { sequelize, SolicitudPermisosLicencias, TipoSolicitud, Estado } from "../../../../models/index.js";

// export const obtenerPermisosLicenciasPorColaborador = async ({
//   id_colaborador,
//   from = null, 
//   to = null, 
//   estado = null,
// }) => {
//   if (!Number.isFinite(Number(id_colaborador))) {
//     throw new Error("id_colaborador es requerido y debe ser numérico");
//   }

//   const where = { id_colaborador: Number(id_colaborador) };

//   if (from && to) {
//     where.fecha_inicio = { [Op.lte]: new Date(to) };
//     where.fecha_fin = { [Op.gte]: new Date(from) };
//   }

//   if (estado) {
//     const estadoRow = await Estado.findOne({
//       where: sequelize.where(
//         sequelize.fn("UPPER", sequelize.col("estado")),
//         String(estado).trim().toUpperCase()
//       ),
//       attributes: ["id_estado"],
//     });
//     if (!estadoRow) throw new Error(`No existe el estado "${estado}" en el catálogo estado`);
//     where.estado_solicitud = estadoRow.id_estado;
//   }

//   const rows = await SolicitudPermisosLicencias.findAll({
//     where,
//     include: [
//       { model: TipoSolicitud, as: "tiposSolicitud", attributes: ["id_tipo_solicitud", "tipo_solicitud", "es_permiso", "es_licencia"] },
//       { model: Estado, as: "estadoSolicitudPermisos", attributes: ["id_estado", "estado"] },
//     ],
//     order: [["fecha_inicio", "DESC"]],
//   });

//   return rows;
// };
