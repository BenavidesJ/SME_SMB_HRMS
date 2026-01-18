import {
  Contrato,
  Colaborador,
  Puesto,
  TipoContrato,
  TipoJornada,
  CicloPago,
  Estado,
  HorarioLaboral,
} from "../../../../../../models/index.js";

/**
 * Obtener todos los contratos de un colaborador
 *
 * @param {{ id_colaborador: number }}
 * @returns {Promise<Array<object>>}
 */
export const obtenerContratosPorColaborador = async ({ id_colaborador }) => {

  const idCol = Number(id_colaborador);
  if (!Number.isInteger(idCol) || idCol <= 0) {
    throw new Error("El ID del colaborador debe ser un número entero válido");
  }

  const colaborador = await Colaborador.findByPk(idCol);
  if (!colaborador) {
    throw new Error(`No existe un colaborador con id ${idCol}`);
  }

  const contratos = await Contrato.findAll({
    where: { id_colaborador: idCol },
    order: [
      ["fecha_inicio", "DESC"],
      ["id_contrato", "DESC"],
    ],
    include: [
      // SIN alias porque no lo definiste en la relación
      { model: Puesto, as: "contratoPuesto", attributes: ["id_puesto", "nombre"], required: false },
      { model: TipoContrato, as: "contrato_tipo_contrato", attributes: ["id_tipo_contrato", "tipo_contrato"], required: false },
      { model: TipoJornada, as: "contrato_tipoJornada", attributes: ["id_tipo_jornada", "tipo", "max_horas_semanales"], required: false },
      { model: CicloPago, as: "contrato_cicloPago", attributes: ["id_ciclo_pago", "nombre"], required: false },

      { model: Estado, as: "estadoContrato", attributes: ["id_estado", "estado"], required: false },

      {
        model: HorarioLaboral,
        as: "contrato_horario",
        required: false,
        attributes: [
          "id_horario",
          "hora_inicio",
          "hora_fin",
          "minutos_descanso",
          "dias_laborales",
          "dias_libres",
          "estado",
          "fecha_actualizacion",
          "id_tipo_jornada",
        ],
      },
    ],
  });

  return contratos.map((c) => ({
    id_contrato: c.id_contrato,
    id_colaborador: c.id_colaborador,
    puesto: c.contratoPuesto.nombre,
    fecha_inicio: c.fecha_inicio,
    tipo_contrato: c.contrato_tipo_contrato.tipo_contrato,
    tipo_jornada: c.contrato_tipoJornada.tipo,
    horas_semanales: c.horas_semanales,
    salario_base: c.salario_base,
    estado: c.estadoContrato.nombre,
    ciclo_pago: c.contrato_cicloPago.nombre ?? null,
    horarios: Array.isArray(c.contrato_horario)
      ? c.contrato_horario.map((h) => ({
        id_horario: h.id_horario,
        hora_inicio: h.hora_inicio,
        hora_fin: h.hora_fin,
        minutos_descanso: h.minutos_descanso,
        dias_laborales: h.dias_laborales,
        dias_libres: h.dias_libres,
        estado: h.estado,
        fecha_actualizacion: h.fecha_actualizacion,
      }))
      : [],
  }));
};
