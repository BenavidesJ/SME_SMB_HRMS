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

export const updateCanton = ({ id, patch }) =>
  runInTransaction(async (transaction) => {
    const cid = requirePositiveInt(id, "id");
    ensurePatchHasAllowedFields(patch, ["id_provincia", "nombre"]);

    const canton = await models.Canton.findByPk(cid, { transaction });
    if (!canton) throw new Error(`No existe cantón con id ${cid}`);

    const idProvincia = optionalPositiveInt(patch.id_provincia, "id_provincia") ?? canton.id_provincia;
    const nombre = optionalString(patch.nombre, "nombre") ?? canton.nombre;

    const provincia = await models.Provincia.findByPk(idProvincia, { transaction });
    if (!provincia) throw new Error(`No existe provincia con id ${idProvincia}`);

    requireNonEmptyString(nombre, "nombre");

    const duplicate = await models.Canton.findOne({
      where: {
        id_provincia: idProvincia,
        nombre,
        id_canton: { [Op.ne]: cid },
      },
      transaction,
    });
    if (duplicate) throw new Error(`Ya existe un cantón ${nombre} en la provincia ${idProvincia}`);

    await models.Canton.update(
      { id_provincia: idProvincia, nombre },
      { where: { id_canton: cid }, transaction }
    );

    const refreshed = await models.Canton.findByPk(cid, { transaction });
    return { id: refreshed.id_canton, id_provincia: refreshed.id_provincia, nombre: refreshed.nombre };
  });
