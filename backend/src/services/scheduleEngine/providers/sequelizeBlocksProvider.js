import { Op } from "sequelize";

/**
 * Trae bloques existentes que pueden generar traslape:
 * - Vacaciones
 * - Incapacidades
 *
 * @returns {Promise<Array<{kind:string,id:any,status:any,startDate:string,endDate:string}>>}
 */
export async function loadExistingBlocksForRange({
  idColaborador,
  startDate,
  endDate,
  models,
  config,
}) {
  if (!idColaborador) throw new Error("loadExistingBlocksForRange: idColaborador is required");
  if (!models?.SolicitudVacaciones) throw new Error("models.SolicitudVacaciones is required");
  if (!models?.Incapacidad) throw new Error("models.Incapacidad is required");

  const tz = config?.timezone || "America/Costa_Rica";

  const vacationBlockStatusIds = config?.vacationBlockStatusIds ?? [];
  const sicknessBlockStatusIds = config?.sicknessBlockStatusIds ?? [];

  const overlapWhere = {
    [Op.and]: [
      { fecha_inicio: { [Op.lte]: endDate } },
      { fecha_fin: { [Op.gte]: startDate } },
    ],
  };

  const [vacRows, sickRows] = await Promise.all([
    models.SolicitudVacaciones.findAll({
      where: {
        id_colaborador: idColaborador,
        ...(vacationBlockStatusIds.length
          ? { estado_solicitud: { [Op.in]: vacationBlockStatusIds } }
          : {}),
        ...overlapWhere,
      },
      attributes: [
        "id_solicitud_vacaciones",
        "estado_solicitud",
        "fecha_inicio",
        "fecha_fin",
      ],
    }),

    models.Incapacidad.findAll({
      where: {
        id_colaborador: idColaborador,
        ...(sicknessBlockStatusIds.length
          ? { /* se podria filtrar por estado */ }
          : {}),
        ...overlapWhere,
      },
      attributes: ["id_incapacidad", "fecha_inicio", "fecha_fin"],
    }),
  ]);

  const blocks = [];

  for (const v of vacRows) {
    blocks.push({
      kind: "VACATION",
      id: v.id_solicitud_vacaciones,
      status: v.estado_solicitud,
      startDate: String(v.fecha_inicio),
      endDate: String(v.fecha_fin),
      tz,
    });
  }

  for (const i of sickRows) {
    blocks.push({
      kind: "SICKNESS",
      id: i.id_incapacidad,
      status: null,
      startDate: String(i.fecha_inicio),
      endDate: String(i.fecha_fin),
      tz,
    });
  }

  return blocks;
}
