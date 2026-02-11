import { buildCrudControllers } from "../../shared/controllerFactory.js";
import { HTTP_CODES } from "../../../../common/strings.js";
import { createDistrito } from "../handlers/create.js";
import { deleteDistrito } from "../handlers/delete.js";
import { getDistrito, getDistritosPorCanton, listDistritos } from "../handlers/read.js";
import { updateDistrito } from "../handlers/update.js";

export const distritoControllers = buildCrudControllers({
  singular: "Distrito",
  plural: "Distritos",
  createHandler: createDistrito,
  listHandler: listDistritos,
  detailHandler: getDistrito,
  updateHandler: updateDistrito,
  deleteHandler: deleteDistrito,
});

export const getDistritosPorCantonController = async (req, res, next) => {
  try {
    const data = await getDistritosPorCanton({ id_canton: req.params.id_canton });
    return res.status(HTTP_CODES.SUCCESS.OK).json({
      success: true,
      status_code: HTTP_CODES.SUCCESS.OK,
      message: "Distritos obtenidos correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
};
