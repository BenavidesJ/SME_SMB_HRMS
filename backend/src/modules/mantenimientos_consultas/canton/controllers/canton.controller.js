import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { HTTP_CODES } from "../../../../common/strings.js";
import { createCanton } from "../handlers/create.js";
import { deleteCanton } from "../handlers/delete.js";
import { getCanton, getCantonPorProvincia, listCantones } from "../handlers/read.js";
import { updateCanton } from "../handlers/update.js";

export const cantonControllers = buildCrudControllers({
  singular: "Cantón",
  plural: "Cantones",
  createHandler: createCanton,
  listHandler: listCantones,
  detailHandler: getCanton,
  updateHandler: updateCanton,
  deleteHandler: deleteCanton,
});

export const getCantonesPorProvinciaController = async (req, res, next) => {
  try {
    const data = await getCantonPorProvincia({ id_provincia: req.params.id_provincia });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Cantones obtenidos correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};
