import { models } from "../../../models/index.js";
import { requireNonEmptyString, requirePositiveInt } from "../../mantenimientos_consultas/shared/validators.js";

const { Estado, CicloPago } = models;

export async function resolveEstado(input, transaction) {
  if (input === undefined || input === null || input === "") {
    throw new Error("El estado es obligatorio");
  }

  if (typeof input === "number" || /^\d+$/.test(String(input))) {
    const id = requirePositiveInt(input, "estado");
    const record = await Estado.findByPk(id, { transaction });
    if (!record) throw new Error(`No existe estado con id ${id}`);
    return record;
  }

  const name = requireNonEmptyString(input, "estado").toUpperCase();
  const record = await Estado.findOne({ where: { estado: name }, transaction });
  if (!record) throw new Error(`No existe estado '${name}'`);
  return record;
}

export async function resolveCicloPago(input, transaction) {
  if (input === undefined || input === null || input === "") {
    throw new Error("El ciclo de pago es obligatorio");
  }

  if (typeof input === "number" || /^\d+$/.test(String(input))) {
    const id = requirePositiveInt(input, "ciclo_pago");
    const record = await CicloPago.findByPk(id, { transaction });
    if (!record) throw new Error(`No existe un ciclo de pago con id ${id}`);
    return record;
  }

  const name = requireNonEmptyString(input, "ciclo_pago").toUpperCase();
  const record = await CicloPago.findOne({ where: { ciclo_pago: name }, transaction });
  if (!record) throw new Error(`No existe ciclo de pago '${name}'`);
  return record;
}

export async function ensureEstado(nombre, transaction) {
  const resolved = await Estado.findOne({ where: { estado: nombre }, transaction });
  if (!resolved) throw new Error(`No existe estado '${nombre}'`);
  return resolved;
}
