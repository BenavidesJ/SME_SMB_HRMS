import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../../common/strings.js";
import { createHttpMocks } from "../../../../test-utils/httpMocks.js";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createCanton = jest.fn();
const deleteCanton = jest.fn();
const getCanton = jest.fn();
const getCantonPorProvincia = jest.fn();
const listCantones = jest.fn();
const updateCanton = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
  buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createCanton }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteCanton }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getCanton, getCantonPorProvincia, listCantones }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateCanton }));

const { cantonControllers, getCantonesPorProvinciaController } = await import("../controllers/canton.controller.js");

describe("cantonControllers", () => {
  test("construye CRUD controllers con handlers y labels correctos", () => {
    expect(buildCrudControllers).toHaveBeenCalledWith({
      singular: "Cantón",
      plural: "Cantones",
      createHandler: createCanton,
      listHandler: listCantones,
      detailHandler: getCanton,
      updateHandler: updateCanton,
      deleteHandler: deleteCanton,
    });
    expect(cantonControllers).toEqual({ stub: true });
  });

  test("getCantonesPorProvinciaController responde ok y propaga errores", async () => {
    const { req, res, next } = createHttpMocks();
    req.params = { id_provincia: "1" };
    getCantonPorProvincia.mockResolvedValue([{ id: 3, id_provincia: 1, nombre: "CENTRAL" }]);

    await getCantonesPorProvinciaController(req, res, next);

    expect(getCantonPorProvincia).toHaveBeenCalledWith({ id_provincia: "1" });
    expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
    expect(next).not.toHaveBeenCalled();

    const error = new Error("boom");
    getCantonPorProvincia.mockRejectedValue(error);
    await getCantonesPorProvinciaController(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });
});
