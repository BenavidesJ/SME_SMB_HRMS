import { sequelize, Direccion, Provincia, Canton, Distrito } from "../../../../../models/index.js";

/**
 * Actualizar Dirección
 *
 * @param {Object} params
 * @param {number|string} params.id
 * @param {Object} params.patch
 * @returns {Promise<object>}
 */
export const actualizarDireccion = async ({ id, patch = {} }) => {
  const tx = await sequelize.transaction();

  try {
    const did = Number(id);
    if (!Number.isInteger(did) || did <= 0) throw new Error("id inválido");

    const direccion = await Direccion.findByPk(did, { transaction: tx });
    if (!direccion) throw new Error(`No existe dirección con id ${did}`);

    const next = {};

    if (patch.otros_datos !== undefined) {
      const otros = String(patch.otros_datos ?? "").trim();
      if (!otros) throw new Error("El campo otros_datos es obligatorio");
      next.otros_datos = otros;
    }

    if (patch.es_principal !== undefined) {
      next.es_principal = Boolean(patch.es_principal);
    }

    if (patch.estado !== undefined) {
      const est = Number(patch.estado);
      if (!Number.isInteger(est) || est <= 0) throw new Error("estado inválido");
      next.estado = est;
    }

    const hasProv = patch.id_provincia !== undefined;
    const hasCanton = patch.id_canton !== undefined;
    const hasDistrito = patch.id_distrito !== undefined;

    const finalProv = hasProv ? Number(patch.id_provincia) : Number(direccion.id_provincia);
    const finalCanton = hasCanton ? Number(patch.id_canton) : Number(direccion.id_canton);
    const finalDistrito = hasDistrito ? Number(patch.id_distrito) : Number(direccion.id_distrito);

    if (hasProv || hasCanton || hasDistrito) {
      if (!Number.isInteger(finalProv) || finalProv <= 0) throw new Error("id_provincia inválido");
      if (!Number.isInteger(finalCanton) || finalCanton <= 0) throw new Error("id_canton inválido");
      if (!Number.isInteger(finalDistrito) || finalDistrito <= 0) throw new Error("id_distrito inválido");

      const provincia = await Provincia.findByPk(finalProv, { transaction: tx });
      if (!provincia) throw new Error(`No existe provincia con id ${finalProv}`);

      const canton = await Canton.findByPk(finalCanton, { transaction: tx });
      if (!canton) throw new Error(`No existe cantón con id ${finalCanton}`);
      if (Number(canton.id_provincia) !== finalProv)
        throw new Error("El cantón no pertenece a la provincia indicada");

      const distrito = await Distrito.findByPk(finalDistrito, { transaction: tx });
      if (!distrito) throw new Error(`No existe distrito con id ${finalDistrito}`);
      if (Number(distrito.id_canton) !== finalCanton)
        throw new Error("El distrito no pertenece al cantón indicado");

      next.id_provincia = finalProv;
      next.id_canton = finalCanton;
      next.id_distrito = finalDistrito;
    }

    const willBePrincipal =
      next.es_principal === true && direccion.es_principal !== true;

    if (willBePrincipal) {
      await Direccion.update(
        { es_principal: false },
        {
          where: {
            id_colaborador: direccion.id_colaborador,
            es_principal: true,
          },
          transaction: tx,
        }
      );
    }

    if (Object.keys(next).length === 0) {
      throw new Error("No se enviaron campos para actualizar");
    }

    const [updated] = await Direccion.update(next, {
      where: { id_direccion: did },
      transaction: tx,
    });

    if (!updated) throw new Error("Registro no encontrado / sin cambios");

    await tx.commit();

    return {
      id_direccion: did,
      id_colaborador: direccion.id_colaborador,
      id_provincia: next.id_provincia ?? direccion.id_provincia,
      id_canton: next.id_canton ?? direccion.id_canton,
      id_distrito: next.id_distrito ?? direccion.id_distrito,
      otros_datos: next.otros_datos ?? direccion.otros_datos,
      es_principal: next.es_principal ?? direccion.es_principal,
      estado: next.estado ?? direccion.estado,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
