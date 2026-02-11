import { Op } from "sequelize";
import { models } from "../../../../models/index.js";
import { runInTransaction } from "../../shared/transaction.js";
import {
  ensurePatchHasAllowedFields,
  optionalPositiveInt,
  optionalString,
  requireNonEmptyString,
  requirePositiveInt,
} from "../../shared/validators.js";

export const updateDistrito = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const did = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["id_canton", "nombre"]);

    const distrito = await models.Distrito.findByPk(did, { transaction });
    if (!distrito) throw new Error(`No existe distrito con id ${did}`);

    const idCanton = optionalPositiveInt(patch.id_canton, "id_canton") ?? distrito.id_canton;
    const nombre = optionalString(patch.nombre, "nombre") ?? distrito.nombre;

    const canton = await models.Canton.findByPk(idCanton, { transaction });
    if (!canton) throw new Error(`No existe cantón con id ${idCanton}`);

    const nombreValidado = requireNonEmptyString(nombre, "nombre");

    const duplicate = await models.Distrito.findOne({
      where: {
        id_canton: idCanton,
        nombre: nombreValidado,
        id_distrito: { [Op.ne]: did },
      },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un distrito ${nombreValidado} en el cantón ${idCanton}`);

    await models.Distrito.update(
      { id_canton: idCanton, nombre: nombreValidado },
      { where: { id_distrito: did }, transaction }
    );

    const refreshed = await models.Distrito.findByPk(did, { transaction });
    return { id: refreshed.id_distrito, id_canton: refreshed.id_canton, nombre: refreshed.nombre };
  });
