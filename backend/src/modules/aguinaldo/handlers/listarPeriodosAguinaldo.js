import { Aguinaldo, Colaborador } from "../../../models/index.js";
import { groupAguinaldosByPeriodo } from "./shared/periodos.js";

export async function listarPeriodosAguinaldo() {
  const registros = await Aguinaldo.findAll({
    include: [
      {
        model: Colaborador,
        as: "registradoPor",
        attributes: ["id_colaborador", "nombre", "primer_apellido", "segundo_apellido"],
      },
    ],
    order: [["id_aguinaldo", "DESC"]],
  });

  return groupAguinaldosByPeriodo(registros);
}