import type { ContractPayload, CreateContractForm } from "../../../types";
import { normalizeDaysString } from "../../../utils/time/normalizeDaysString";
import { normalizeTimeToHHMMSS } from "../../../utils/time/normalizeTime";

export const mapFormToPayload = (form: CreateContractForm, idColaborador: number): ContractPayload => {
  const salario = Number(form.salario_base);
  const horas = Number(form.horas_semanales);
  const descanso = Number(form.minutos_descanso);

  return {
    id_colaborador: idColaborador,
    puesto: String(form.puesto).trim(),
    fecha_inicio: String(form.fecha_ingreso).trim(),
    tipo_contrato: String(form.tipo_contrato).trim(),
    tipo_jornada: String(form.tipo_jornada).trim(),
    salario_base: Number.isFinite(salario) ? salario : 0,
    ciclo_pago: String(form.ciclo_pago).trim(),
    horas_semanales: Number.isFinite(horas) ? horas : 0,
    horario: {
      hora_inicio: normalizeTimeToHHMMSS(form.hora_inicio),
      hora_fin: normalizeTimeToHHMMSS(form.hora_fin),
      minutos_descanso: Number.isFinite(descanso) ? descanso : 0,
      dias_laborales: normalizeDaysString(form.dias_laborales),
      dias_libres: normalizeDaysString(form.dias_libres),
    },
  };
};
