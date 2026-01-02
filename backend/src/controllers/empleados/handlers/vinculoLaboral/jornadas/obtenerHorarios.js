import dayjs from "dayjs";
import {
  HorarioLaboral,
  Contrato,
  Estado,
  TipoJornada,
  Puesto,
} from "../../../../../models/index.js";

/**
 * Obtiene todos los horarios laborales
 *
 * @returns {Promise<Array<object>>}
 */
export const obtenerHorariosLaborales = async () => {
  const horarios = await HorarioLaboral.findAll({
    attributes: [
      "id_horario",
      "id_contrato",
      "hora_inicio",
      "hora_fin",
      "minutos_descanso",
      "dias_laborales",
      "dias_libres",
      "estado",
      "fecha_actualizacion",
      "id_tipo_jornada",
    ],
    include: [
      {
        model: Estado,
        as: "estadoHorario",
        attributes: ["estado"],
        required: false,
      },
      {
        model: TipoJornada,
        as: "tipoJornadaHorario",
        attributes: ["tipo", "max_horas_diarias", "max_horas_semanales"],
        required: false,
      },
      {
        model: Contrato,
        attributes: ["id_contrato", "id_colaborador", "fecha_inicio"],
        required: false,
        include: [
          {
            model: Puesto,
            attributes: ["id_puesto", "nombre"],
            required: false,
          },
        ],
      },
    ],
    order: [["id_horario", "DESC"]],
  });

  return horarios.map((h) => ({
    id: h.id_horario,
    id_contrato: h.id_contrato,

    hora_inicio: h.hora_inicio,
    hora_fin: h.hora_fin,
    minutos_descanso: h.minutos_descanso,

    dias_laborales: h.dias_laborales,
    dias_libres: h.dias_libres,

    fecha_actualizacion: h.fecha_actualizacion
      ? dayjs(h.fecha_actualizacion).format("YYYY-MM-DD")
      : "",

    estado: h.estadoHorario?.estado ?? "",

    tipo_jornada: h.tipoJornadaHorario?.tipo ?? "",
    max_horas_diarias: h.tipoJornadaHorario?.max_horas_diarias ?? "",
    max_horas_semanales: h.tipoJornadaHorario?.max_horas_semanales ?? "",

    contrato: h.Contrato
      ? {
        id_contrato: h.Contrato.id_contrato,
        id_colaborador: h.Contrato.id_colaborador,
        fecha_inicio: h.Contrato.fecha_inicio
          ? dayjs(h.Contrato.fecha_inicio).format("YYYY-MM-DD")
          : "",
        puesto: h.Contrato.Puesto?.nombre ?? "",
      }
      : "",
  }));
};
