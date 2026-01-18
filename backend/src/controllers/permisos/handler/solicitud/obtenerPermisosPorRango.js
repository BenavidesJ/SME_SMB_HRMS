import { Op } from "sequelize";
import { sequelize, SolicitudPermisosLicencias, TipoSolicitud, Estado } from "../../../../models/index.js";

export const obtenerPermisosLicenciasPorRango = async ({
  desde,
  hasta,
  estado = null,
  id_colaborador = null,
}) => {
  if (!desde || !hasta) throw new Error("desde y hasta son requeridos");
  const fromDate = new Date(desde);
  const toDate = new Date(hasta);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new Error("desde/hasta inválidos");
  }

  const where = {
    fecha_inicio: { [Op.lte]: toDate },
    fecha_fin: { [Op.gte]: fromDate },
  };

  if (id_colaborador !== null && id_colaborador !== undefined) {
    if (!Number.isFinite(Number(id_colaborador))) throw new Error("id_colaborador inválido");
    where.id_colaborador = Number(id_colaborador);
  }

  if (estado) {
    const estadoRow = await Estado.findOne({
      where: sequelize.where(
        sequelize.fn("UPPER", sequelize.col("estado")),
        String(estado).trim().toUpperCase()
      ),
      attributes: ["id_estado"],
    });
    if (!estadoRow) throw new Error(`No existe el estado "${estado}" en el catálogo estado`);
    where.estado_solicitud = estadoRow.id_estado;
  }

  const rows = await SolicitudPermisosLicencias.findAll({
    where,
    include: [
      { model: TipoSolicitud, as: "tiposSolicitud", attributes: ["id_tipo_solicitud", "tipo_solicitud", "es_permiso", "es_licencia"] },
      { model: Estado, as: "estadoSolicitudPermisos", attributes: ["id_estado", "estado"] },
    ],
    order: [["fecha_inicio", "ASC"]],
  });

  return rows;
};
