import { models } from "../../../../models/index.js";
import { requirePositiveInt } from "../../../mantenimientos_consultas/shared/validators.js";
import { buildDetalleEnriquecido } from "./getPayrollDetails.js";
import { resolveActorFromToken } from "../../shared/resolveActor.js";

const { Planilla } = models;

export async function obtenerMiComprobantePlanilla({ tokenId, id_detalle }) {
  const actor = await resolveActorFromToken(tokenId);
  const idDetalle = requirePositiveInt(id_detalle, "id_detalle");

  const planilla = await Planilla.findOne({
    where: {
      id_detalle: idDetalle,
      id_colaborador: actor.id_colaborador,
    },
    include: [
      {
        association: "periodo",
        attributes: ["id_periodo", "fecha_inicio", "fecha_fin", "fecha_pago"],
        include: [
          {
            association: "estadoRef",
            attributes: ["estado"],
            required: false,
          },
        ],
      },
      {
        association: "colaborador",
        attributes: [
          "id_colaborador",
          "nombre",
          "primer_apellido",
          "segundo_apellido",
          "identificacion",
          "correo_electronico",
          "cantidad_hijos",
          "estado_civil",
        ],
        include: [
          {
            association: "estadoCivilRef",
            attributes: ["estado_civil"],
            required: false,
          },
        ],
      },
      {
        association: "contrato",
        attributes: ["id_contrato", "salario_base", "horas_semanales"],
        required: false,
        include: [
          {
            association: "puesto",
            attributes: ["nombre"],
            required: false,
            include: [
              {
                association: "departamento",
                attributes: ["nombre"],
                required: false,
              },
            ],
          },
        ],
      },
      {
        association: "deduccionesDetalle",
        attributes: ["id_planilla", "id_deduccion"],
        include: [
          {
            association: "deduccion",
            attributes: ["id_deduccion", "nombre", "valor"],
          },
        ],
      },
    ],
  });

  if (!planilla) {
    throw new Error("No se encontró la planilla solicitada para el usuario autenticado");
  }

  return {
    comprobante: buildDetalleEnriquecido(
      planilla,
      planilla.contrato,
      planilla.deduccionesDetalle ?? [],
      planilla.colaborador ?? null
    ),
    periodo: {
      id_periodo: Number(planilla.periodo?.id_periodo ?? planilla.id_periodo),
      fecha_inicio: planilla.periodo?.fecha_inicio ?? null,
      fecha_fin: planilla.periodo?.fecha_fin ?? null,
      fecha_pago: planilla.periodo?.fecha_pago ?? null,
      estado: planilla.periodo?.estadoRef?.estado ?? null,
    },
    colaborador: {
      id_colaborador: Number(planilla.colaborador?.id_colaborador ?? planilla.id_colaborador),
      nombre_completo: [
        planilla.colaborador?.nombre,
        planilla.colaborador?.primer_apellido,
        planilla.colaborador?.segundo_apellido,
      ]
        .filter(Boolean)
        .join(" "),
      identificacion: planilla.colaborador?.identificacion ?? null,
      correo_electronico: planilla.colaborador?.correo_electronico ?? null,
      puesto: planilla.contrato?.puesto?.nombre ?? null,
      departamento: planilla.contrato?.puesto?.departamento?.nombre ?? null,
    },
    empresa: {
      nombre: "BioAlquimia",
    },
    generado_en: new Date().toISOString(),
  };
}