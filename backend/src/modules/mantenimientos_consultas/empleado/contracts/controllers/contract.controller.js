import { HTTP_CODES } from "../../../../../common/strings.js";
import { listContractsByColaborador } from "../handlers/list.js";
import { createContractForColaborador } from "../handlers/create.js";
import { updateContractForColaborador } from "../handlers/update.js";

export const contratoControllers = {
  listByColaborador: async (req, res, next) => {
    try {
      const data = await listContractsByColaborador({ id: req.params.id });
      res.status(HTTP_CODES.SUCCESS.OK).json({
        success: true,
        status_code: HTTP_CODES.SUCCESS.OK,
        message: "Contratos obtenidos correctamente",
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  createForColaborador: async (req, res, next) => {
    try {
      const { contrato, warnings } = await createContractForColaborador({ id: req.params.id, payload: req.body ?? {} });
      res.status(HTTP_CODES.SUCCESS.CREATED).json({
        success: true,
        status_code: HTTP_CODES.SUCCESS.CREATED,
        message: "Contrato creado correctamente",
        data: contrato,
        warnings: warnings ?? [],
      });
    } catch (error) {
      next(error);
    }
  },

  updateForColaborador: async (req, res, next) => {
    try {
      const { contrato, warnings } = await updateContractForColaborador({
        colaboradorId: req.params.id,
        contratoId: req.params.contratoId,
        patch: req.body ?? {},
      });
      res.status(HTTP_CODES.SUCCESS.OK).json({
        success: true,
        status_code: HTTP_CODES.SUCCESS.OK,
        message: "Contrato actualizado correctamente",
        data: contrato,
        warnings: warnings ?? [],
      });
    } catch (error) {
      next(error);
    }
  },
};
