import { Op } from "sequelize";
import {
  JornadaDiaria,
  Incapacidad,
  TipoIncapacidad,
} from "../../../models/index.js";

function assertId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("id_colaborador debe ser un entero positivo");
  }
  return n;
}
export async function listarIncapacidadesPorColaborador({ id_colaborador }) {
  const idColaborador = assertId(id_colaborador);

  const whereClause = {
    id_colaborador: idColaborador,
    incapacidad: { [Op.ne]: null },
  };

  const rows = await JornadaDiaria.findAll({
    where: whereClause,
    include: [
      {
        model: Incapacidad,
        as: "incapacidadRef",
        required: true,
        include: [
          {
            model: TipoIncapacidad,
            as: "tipo",
            attributes: ["nombre"],
          },
        ],
      },
    ],
    order: [
      ["fecha", "ASC"],
      ["id_jornada", "ASC"],
    ],
  });

  // Agrupar por numero_boleta para devolver un solo evento por incapacidad
  const gruposMap = new Map();

  for (const row of rows) {
    const plain = row.get({ plain: true });
    const incapacidad = plain.incapacidadRef ?? {};
    const tipo = incapacidad.tipo ?? {};
    const boletaKey = incapacidad.numero_boleta ?? `sin_boleta_${incapacidad.id_incapacidad}`;

    if (!gruposMap.has(boletaKey)) {
      gruposMap.set(boletaKey, {
        numero_boleta: incapacidad.numero_boleta ?? null,
        tipo_incapacidad: tipo.nombre ? String(tipo.nombre) : null,
        fecha_inicio: incapacidad.fecha_inicio ?? null,
        fecha_fin: incapacidad.fecha_fin ?? null,
        dias: [],
      });
    }

    const entry = gruposMap.get(boletaKey);

    entry.dias.push({
      id_jornada: Number(plain.id_jornada),
      fecha: String(plain.fecha),
      id_incapacidad: Number(incapacidad.id_incapacidad ?? 0) || null,
      porcentaje_patrono: Number(incapacidad.porcentaje_patrono ?? 0),
      porcentaje_ccss: Number(incapacidad.porcentaje_ccss ?? 0),
    });
  }

  // Convertir a array y ordenar por fecha_inicio DESC (más recientes primero)
  return Array.from(gruposMap.values()).sort((a, b) =>
    String(b.fecha_inicio ?? "").localeCompare(String(a.fecha_inicio ?? "")),
  );
}
