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
      ["fecha", "DESC"],
      ["id_jornada", "DESC"],
    ],
  });

  return rows.map((row) => {
    const plain = row.get({ plain: true });
    const incapacidad = plain.incapacidadRef ?? {};
    const tipo = incapacidad.tipo ?? {};

    return {
      id_jornada: Number(plain.id_jornada),
      fecha: String(plain.fecha),
      id_incapacidad: Number(incapacidad.id_incapacidad ?? 0) || null,
      tipo_incapacidad: tipo.nombre ? String(tipo.nombre) : null,
      porcentaje_patrono: Number(incapacidad.porcentaje_patrono ?? 0),
      porcentaje_ccss: Number(incapacidad.porcentaje_ccss ?? 0),
    };
  });
}
