import { sequelize, TipoJornada } from "../../../../../../models/index.js";

function asPositiveNumberOrUndefined(value, fieldName) {
  if (value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${fieldName} debe ser un número mayor a 0`);
  return n;
}

export const actualizarTipoJornada = async ({ id, patch }) => {
  const tx = await sequelize.transaction();
  try {
    const found = await TipoJornada.findByPk(id, { transaction: tx });
    if (!found) throw new Error(`No existe el tipo de jornada con id: ${id}`);

    const next = {};

    if (patch?.tipo !== undefined) {
      const tipoValue = String(patch.tipo ?? "").trim().toUpperCase();
      if (!tipoValue) throw new Error("El tipo de jornada es obligatorio");

      const exists = await TipoJornada.findOne({
        where: { tipo: tipoValue },
        transaction: tx,
      });

      if (exists && exists.id_tipo_jornada !== found.id_tipo_jornada) {
        throw new Error(`Ya existe un tipo de jornada: ${tipoValue}`);
      }

      next.tipo = tipoValue;
    }

    const diarias = asPositiveNumberOrUndefined(patch?.max_horas_diarias, "max_horas_diarias");
    const semanales = asPositiveNumberOrUndefined(patch?.max_horas_semanales, "max_horas_semanales");

    if (diarias !== undefined) next.max_horas_diarias = diarias;
    if (semanales !== undefined) next.max_horas_semanales = semanales;

    await found.update(next, { transaction: tx });
    await tx.commit();

    return {
      id_tipo_jornada: found.id_tipo_jornada,
      tipo: found.tipo,
      max_horas_diarias: found.max_horas_diarias,
      max_horas_semanales: found.max_horas_semanales,
    };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
};
