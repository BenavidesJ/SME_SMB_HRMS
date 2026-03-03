import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../../common/strings.js";
import { createHttpMocks } from "../../../../test-utils/httpMocks.js";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createDistrito = jest.fn();
const deleteDistrito = jest.fn();
const getDistrito = jest.fn();
const getDistritosPorCanton = jest.fn();
const listDistritos = jest.fn();
const updateDistrito = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
  buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createDistrito }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteDistrito }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getDistrito, getDistritosPorCanton, listDistritos }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateDistrito }));

const { distritoControllers, getDistritosPorCantonController } = await import("../controllers/distrito.controller.js");

describe("distritoControllers", () => {
  test("construye CRUD controllers con handlers y labels correctos", () => {
    expect(buildCrudControllers).toHaveBeenCalledWith({
      singular: "Distrito",
      plural: "Distritos",
      createHandler: createDistrito,
      listHandler: listDistritos,
      detailHandler: getDistrito,
      updateHandler: updateDistrito,
      deleteHandler: deleteDistrito,
    });
    expect(distritoControllers).toEqual({ stub: true });
  });

  test("getDistritosPorCantonController responde ok y propaga errores", async () => {
    const { req, res, next } = createHttpMocks();
    req.params = { id_canton: "2" };
    getDistritosPorCanton.mockResolvedValue([{ id: 1, id_canton: 2, nombre: "A" }]);

    await getDistritosPorCantonController(req, res, next);

    expect(getDistritosPorCanton).toHaveBeenCalledWith({ id_canton: "2" });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();

    const error = new Error("boom");
    getDistritosPorCanton.mockRejectedValue(error);
    await getDistritosPorCantonController(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
