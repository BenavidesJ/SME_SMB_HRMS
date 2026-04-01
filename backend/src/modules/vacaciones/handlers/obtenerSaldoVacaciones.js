import { Colaborador, SaldoVacaciones } from "../../../models/index.js";
import { assertId } from "./utils/vacacionesUtils.js";

export async function obtenerSaldoVacaciones({ id_colaborador }) {
  const idColaborador = assertId(id_colaborador, "id_colaborador");

  const colaborador = await Colaborador.findByPk(idColaborador, {
    attributes: ["id_colaborador"],
  });

  if (!colaborador) {
    throw new Error(`No existe colaborador con id ${idColaborador}`);
  }

  const saldo = await SaldoVacaciones.findOne({
    where: { id_colaborador: idColaborador },
    attributes: ["id_saldo_vac", "dias_ganados", "dias_tomados"],
  });

  const diasGanados = saldo ? Number(saldo.dias_ganados) : 0;
  const diasTomados = saldo ? Number(saldo.dias_tomados) : 0;
  const diasDisponibles = Math.max(diasGanados - diasTomados, 0);

  return {
    id_colaborador: idColaborador,
    id_saldo_vacaciones: saldo ? Number(saldo.id_saldo_vac) : null,
    dias_ganados: diasGanados,
    dias_tomados: diasTomados,
    dias_disponibles: diasDisponibles,
  };
}