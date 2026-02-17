import { HTTP_CODES } from "../../../common/strings.js";

const ok = HTTP_CODES.SUCCESS.OK;
const created = HTTP_CODES.SUCCESS.CREATED;

const defaultMessage = (action, singular, plural) => {
  switch (action) {
    case "create": return `${singular} creado correctamente`;
    case "list": return `${plural} obtenidos correctamente`;
    case "detail": return `${singular} obtenido correctamente`;
    case "update": return `${singular} actualizado correctamente`;
    case "delete": return `${singular} eliminado correctamente`;
    default: return "Operación realizada con éxito";
  }
};

const respond = (res, status, message, data) =>
  res.status(status).json({ success: true, status_code: status, message, data });

export function buildCrudControllers({ singular, plural, createHandler, listHandler, detailHandler, updateHandler, deleteHandler }) {
  return {
    createController: async (req, res, next) => {
      try {
        const data = await createHandler(req.body ?? {});
        respond(res, created, defaultMessage("create", singular, plural), data);
      } catch (error) { next(error); }
    },
    listController: async (req, res, next) => {
      try {
        const data = await (listHandler ? listHandler(req.query ?? {}) : []);
        respond(res, ok, defaultMessage("list", singular, plural), data);
      } catch (error) { next(error); }
    },
    detailController: async (req, res, next) => {
      try {
        const data = await detailHandler({ id: req.params.id, query: req.query ?? {} });
        respond(res, ok, defaultMessage("detail", singular, plural), data);
      } catch (error) { next(error); }
    },
    updateController: async (req, res, next) => {
      try {
        const data = await updateHandler({ id: req.params.id, patch: req.body ?? {} });
        respond(res, ok, defaultMessage("update", singular, plural), data);
      } catch (error) { next(error); }
    },
    deleteController: async (req, res, next) => {
      try {
        const data = await deleteHandler({ id: req.params.id });
        respond(res, ok, defaultMessage("delete", singular, plural), data);
      } catch (error) { next(error); }
    },
  };
}