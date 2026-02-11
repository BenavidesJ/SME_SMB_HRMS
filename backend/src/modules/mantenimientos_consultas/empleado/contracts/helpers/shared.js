import dayjs from "dayjs";
import { Op, fn, col } from "sequelize";
import { models, sequelize } from "../../../../../models/index.js";
import { normalizeDecimal } from "../../../../../common/normalizeDecimal.js";
import { normalizeDateOnly } from "../../../../../common/normalizeDateOnly.js";
import { requireNonEmptyString, requirePositiveInt } from "../../../shared/validators.js";

export const contractInclude = [
  { model: models.Puesto, as: "puesto", attributes: ["nombre", "es_jefe", "id_departamento"] },
  { model: models.TipoContrato, as: "tipoContrato", attributes: ["tipo_contrato"] },
  { model: models.TipoJornada, as: "tipoJornada", attributes: ["tipo", "max_horas_diarias", "max_horas_semanales"] },
  { model: models.Estado, as: "estadoRef", attributes: ["id_estado", "estado"] },
  {
    model: models.HorarioLaboral,
    as: "horarios",
    attributes: [
      "id_horario",
      "hora_inicio",
      "hora_fin",
      "dias_laborales",
      "dias_libres",
      "estado",
      "fecha_actualizacion",
      "id_tipo_jornada",
    ],
    separate: true,
    order: [["fecha_actualizacion", "DESC"], ["id_horario", "DESC"]],
  },
];

const VALID_DAY_CODES = new Set(["L", "K", "M", "J", "V", "S", "D"]);

export function serializeContract(instance) {
  if (!instance) return null;
  const plain = typeof instance.get === "function" ? instance.get({ plain: true }) : instance;
  return {
    id_contrato: plain.id_contrato,
    id_colaborador: plain.id_colaborador,
    puesto: plain.puesto?.nombre ?? null,
    fecha_inicio: plain.fecha_inicio,
    tipo_contrato: plain.tipoContrato?.tipo_contrato ?? null,
    tipo_jornada: plain.tipoJornada?.tipo ?? null,
    horas_semanales: plain.horas_semanales,
    salario_base: plain.salario_base,
    estado: plain.estadoRef?.estado ?? null,
    horarios: (plain.horarios ?? []).map((horario) => ({
      id_horario: horario.id_horario,
      hora_inicio: horario.hora_inicio,
      hora_fin: horario.hora_fin,
      minutos_descanso: Number(horario.minutos_descanso ?? 0),
      dias_laborales: horario.dias_laborales,
      dias_libres: horario.dias_libres,
      estado: horario.estado,
      fecha_actualizacion: horario.fecha_actualizacion,
      id_tipo_jornada: horario.id_tipo_jornada,
    })),
  };
}

export async function ensureColaboradorExists(id, transaction) {
  const colaboradorId = requirePositiveInt(id, "id_colaborador");
  const colaborador = await models.Colaborador.findByPk(colaboradorId, { attributes: ["id_colaborador"], transaction });
  if (!colaborador) throw new Error(`No existe un colaborador con id ${colaboradorId}`);
  return colaborador;
}

export function normalizeTime(value, fieldName) {
  const raw = requireNonEmptyString(value, fieldName);
  const normalized = /^\d{2}:\d{2}$/.test(raw) ? `${raw}:00` : raw;
  if (!/^\d{2}:\d{2}:\d{2}$/.test(normalized)) {
    throw new Error(`${fieldName} debe tener formato HH:mm:ss`);
  }
  const [hh, mm, ss] = normalized.split(":").map((part) => Number(part));
  if (
    !Number.isInteger(hh) ||
    !Number.isInteger(mm) ||
    !Number.isInteger(ss) ||
    hh < 0 ||
    hh > 23 ||
    mm < 0 ||
    mm > 59 ||
    ss < 0 ||
    ss > 59
  ) {
    throw new Error(`${fieldName} no contiene una hora válida`);
  }
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}

export function timeToSeconds(time24) {
  const [hh, mm, ss] = time24.split(":").map(Number);
  return hh * 3600 + mm * 60 + (ss ?? 0);
}

export function normalizeDays(value, fieldName) {
  const raw = requireNonEmptyString(value, fieldName).toUpperCase();
  for (const char of raw) {
    if (!VALID_DAY_CODES.has(char)) {
      throw new Error(`${fieldName} contiene un código de día inválido`);
    }
  }
  const deduped = Array.from(new Set(raw.split(""))).join("");
  if (!deduped) throw new Error(`${fieldName} debe contener al menos un día`);
  return deduped;
}

export function ensureDisjoint(laborales, libres) {
  const libresSet = new Set(libres.split(""));
  for (const char of laborales) {
    if (libresSet.has(char)) {
      throw new Error("horario.dias_laborales y horario.dias_libres no pueden compartir días");
    }
  }
}

export async function resolvePuesto(nombre, transaction) {
  const raw = requireNonEmptyString(nombre, "puesto");
  const upper = raw.toUpperCase();
  const puesto = await models.Puesto.findOne({
    where: sequelize.where(fn("UPPER", col("nombre")), upper),
    transaction,
  });
  if (!puesto) throw new Error(`No existe un puesto ${raw}`);
  return puesto;
}

export async function resolveTipoContrato(nombre, transaction) {
  const raw = requireNonEmptyString(nombre, "tipo_contrato").toUpperCase();
  const tipo = await models.TipoContrato.findOne({
    where: sequelize.where(fn("UPPER", col("tipo_contrato")), raw),
    transaction,
  });
  if (!tipo) throw new Error(`No existe un tipo de contrato ${nombre}`);
  return tipo;
}

export async function resolveTipoJornada(nombre, transaction) {
  const raw = requireNonEmptyString(nombre, "tipo_jornada").toUpperCase();
  const tipo = await models.TipoJornada.findOne({
    where: sequelize.where(fn("UPPER", col("tipo")), raw),
    transaction,
  });
  if (!tipo) throw new Error(`No existe un tipo de jornada ${nombre}`);
  return tipo;
}

export async function resolveCicloPago(valor, transaction) {
  const raw = requireNonEmptyString(valor, "ciclo_pago").toUpperCase();
  const ciclo = await models.CicloPago.findOne({
    where: sequelize.where(fn("UPPER", col("ciclo_pago")), raw),
    transaction,
  });
  if (!ciclo) throw new Error(`No existe ciclo de pago ${valor}`);
  return ciclo;
}

export function buildWarnings(puesto, salarioBaseNormalized) {
  const warnings = [];
  const salMin = puesto?.sal_base_referencia_min !== undefined ? Number(puesto.sal_base_referencia_min) : undefined;
  const salMax = puesto?.sal_base_referencia_max !== undefined ? Number(puesto.sal_base_referencia_max) : undefined;
  const salario = Number(salarioBaseNormalized);
  if (Number.isFinite(salario)) {
    if (Number.isFinite(salMin) && salario < salMin) {
      warnings.push(
        `El salario_base (${salario}) es menor al salario de referencia mínimo del puesto (${salMin}). Verifique si corresponde.`
      );
    }
    if (Number.isFinite(salMax) && salario > salMax) {
      warnings.push(
        `El salario_base (${salario}) excede el salario de referencia máximo del puesto (${salMax}). Considere actualizar las referencias del puesto.`
      );
    }
  }
  return warnings;
}

export async function fetchContractById(id, transaction) {
  const contrato = await models.Contrato.findByPk(id, { include: contractInclude, transaction });
  return serializeContract(contrato);
}

export function normalizeSalario(value) {
  return normalizeDecimal(value, { precision: 12, scale: 2, fieldName: "salario_base" });
}

export function normalizeHorasSemanales(value, maxHoras) {
  const horasValue =
    value === undefined || value === null || String(value).trim() === ""
      ? maxHoras
      : value;

  return normalizeDecimal(horasValue, { precision: 5, scale: 2, fieldName: "horas_semanales" });
}

export function validateHorasContraJornada(horasSemanal, maxHoras) {
  const horasNum = Number(horasSemanal);
  const max = Number(maxHoras);
  if (!Number.isFinite(horasNum)) {
    throw new Error("horas_semanales debe ser numérico");
  }
  if (horasNum <= 0) {
    throw new Error("horas_semanales debe ser mayor a 0");
  }
  if (Number.isFinite(max) && horasNum > max) {
    throw new Error(`horas_semanales (${horasNum}) no puede exceder el máximo semanal del tipo de jornada (${max})`);
  }
}

export function normalizeFechaInicio(value) {
  return normalizeDateOnly(value, "fecha_inicio");
}

export function normalizeHorarioPayload(horarioPayload) {
  if (!horarioPayload || typeof horarioPayload !== "object" || Array.isArray(horarioPayload)) {
    throw new Error("La información del horario es obligatoria");
  }

  const horaInicio = normalizeTime(horarioPayload.hora_inicio, "horario.hora_inicio");
  const horaFin = normalizeTime(horarioPayload.hora_fin, "horario.hora_fin");

  if (horaInicio === horaFin) {
    throw new Error("La hora de inicio y la hora de salida no pueden ser iguales.");
  }

  if (timeToSeconds(horaFin) <= timeToSeconds(horaInicio)) {
    throw new Error("La hora de fin debe ser mayor a la hora de inicio");
  }

  const diasLaborales = normalizeDays(horarioPayload.dias_laborales, "horario.dias_laborales");
  const diasLibres = normalizeDays(horarioPayload.dias_libres, "horario.dias_libres");
  ensureDisjoint(diasLaborales, diasLibres);

  return {
    horaInicio,
    horaFin,
    diasLaborales,
    diasLibres,
    fechaActualizacion: dayjs().format("YYYY-MM-DD"),
  };
}

export async function ensureSingleActiveContract({ colaboradorId, excludeContractId, estadoActivoId, transaction, message }) {
  const existing = await models.Contrato.findOne({
    where: {
      id_colaborador: colaboradorId,
      estado: estadoActivoId,
      ...(excludeContractId ? { id_contrato: { [Op.ne]: excludeContractId } } : {}),
    },
    attributes: ["id_contrato"],
    transaction,
  });

  if (existing) {
    throw new Error(
      message ??
        "El colaborador ya tiene otro contrato activo. Primero desactive el contrato activo actual antes de activar uno nuevo."
    );
  }
}
