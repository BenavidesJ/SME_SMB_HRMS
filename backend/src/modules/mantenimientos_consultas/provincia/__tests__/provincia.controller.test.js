import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createProvincia = jest.fn();
const deleteProvincia = jest.fn();
const getProvincia = jest.fn();
const listProvincias = jest.fn();
const updateProvincia = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
  buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createProvincia }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteProvincia }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getProvincia, listProvincias }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateProvincia }));

const { provinciaControllers } = await import("../controllers/provincia.controller.js");

describe("provinciaControllers", () => {
  test("construye CRUD controllers con handlers y labels correctos", () => {
    expect(buildCrudControllers).toHaveBeenCalledWith({
      singular: "Provincia",
      plural: "Provincias",
      createHandler: createProvincia,
      listHandler: listProvincias,
      detailHandler: getProvincia,
      updateHandler: updateProvincia,
      deleteHandler: deleteProvincia,
    });
    expect(provinciaControllers).toEqual({ stub: true });
  });
});
