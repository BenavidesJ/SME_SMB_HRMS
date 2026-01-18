import { sequelize, TipoContrato } from "../../../../../../models/index.js";

export const actualizarTipoContrato = async ({ id, patch }) => {
  const tx = await sequelize.transaction();
  try {
    const found = await TipoContrato.findByPk(id, { transaction: tx });
    if (!found) throw new Error(`No existe el tipo de contrato con id: ${id}`);

    const next = {};

    if (patch?.tipo_contrato !== undefined) {
      const value = String(patch.tipo_contrato ?? "").trim().toUpperCase();
      if (!value) throw new Error("El tipo de contrato es obligatorio");

      const exists = await TipoContrato.findOne({
        where: { tipo_contrato: value },
        transaction: tx,
      });

      if (exists && exists.id_tipo_contrato !== found.id_tipo_contrato) {
        throw new Error(`Ya existe un tipo de contrato: ${value}`);
      }

      next.tipo_contrato = value;
    }

    await found.update(next, { transaction: tx });
    await tx.commit();

    return {
      id_tipo_contrato: found.id_tipo_contrato,
      tipo_contrato: found.tipo_contrato,
    };
  } catch (e) {
    await tx.rollback();
    throw e;
  }
};
