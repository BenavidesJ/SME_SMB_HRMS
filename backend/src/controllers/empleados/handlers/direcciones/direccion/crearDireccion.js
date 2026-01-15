import { sequelize, Direccion, Colaborador, Provincia, Canton, Distrito } from "../../../../../models/index.js";

/**
 * Crear Dirección para un colaborador
 *
 * - Valida existencia del colaborador y la jerarquía provincia→cantón→distrito
 * - Si es_principal=true, desmarca otras direcciones principales del colaborador
 *
 * @param {Object} params
 * @param {number|string} params.id_colaborador
 * @param {number|string} params.id_provincia
 * @param {number|string} params.id_canton
 * @param {number|string} params.id_distrito
 * @param {string} params.otros_datos
 * @param {boolean=} params.es_principal
 * @param {number=} params.estado
 * @returns {Promise<object>}
 */
export const crearDireccion = async ({
  id_colaborador,
  id_provincia,
  id_canton,
  id_distrito,
  otros_datos,
  es_principal = true,
  estado = 1,
}) => {
  const tx = await sequelize.transaction();

  try {
    const cid = Number(id_colaborador);
    if (!Number.isInteger(cid) || cid <= 0) throw new Error("id_colaborador inválido");

    const pid = Number(id_provincia);
    if (!Number.isInteger(pid) || pid <= 0) throw new Error("id_provincia inválido");

    const caid = Number(id_canton);
    if (!Number.isInteger(caid) || caid <= 0) throw new Error("id_canton inválido");

    const did = Number(id_distrito);
    if (!Number.isInteger(did) || did <= 0) throw new Error("id_distrito inválido");

    const otros = String(otros_datos ?? "").trim();
    if (!otros) throw new Error("El campo otros_datos es obligatorio");

    const colaborador = await Colaborador.findByPk(cid, { transaction: tx });
    if (!colaborador) throw new Error(`No existe colaborador con id ${cid}`);

    const provincia = await Provincia.findByPk(pid, { transaction: tx });
    if (!provincia) throw new Error(`No existe provincia con id ${pid}`);

    const canton = await Canton.findByPk(caid, { transaction: tx });
    if (!canton) throw new Error(`No existe cantón con id ${caid}`);
    if (Number(canton.id_provincia) !== pid)
      throw new Error("El cantón no pertenece a la provincia indicada");

    const distrito = await Distrito.findByPk(did, { transaction: tx });
    if (!distrito) throw new Error(`No existe distrito con id ${did}`);
    if (Number(distrito.id_canton) !== caid)
      throw new Error("El distrito no pertenece al cantón indicado");

    // Si la nueva dirección será principal, desmarcar las demás
    const principal = Boolean(es_principal);
    if (principal) {
      await Direccion.update(
        { es_principal: false },
        { where: { id_colaborador: cid, es_principal: true }, transaction: tx }
      );
    }

    const created = await Direccion.create(
      {
        id_colaborador: cid,
        id_provincia: pid,
        id_canton: caid,
        id_distrito: did,
        otros_datos: otros,
        es_principal: principal,
        estado: Number(estado) || 1,
      },
      { transaction: tx }
    );

    await tx.commit();

    return {
      id_direccion: created.id_direccion,
      id_colaborador: created.id_colaborador,
      id_provincia: created.id_provincia,
      id_canton: created.id_canton,
      id_distrito: created.id_distrito,
      otros_datos: created.otros_datos,
      es_principal: created.es_principal,
      estado: created.estado,
    };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
};
