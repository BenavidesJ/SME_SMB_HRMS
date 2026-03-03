import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createPuesto = jest.fn();
const deletePuesto = jest.fn();
const getPuesto = jest.fn();
const listPuestos = jest.fn();
const updatePuesto = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
  buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createPuesto }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deletePuesto }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getPuesto, listPuestos }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updatePuesto }));

const { puestoControllers } = await import("../controllers/puesto.controller.js");

describe("puestoControllers", () => {
  test("construye CRUD controllers con handlers y labels correctos", () => {
    expect(buildCrudControllers).toHaveBeenCalledWith({
      singular: "Puesto",
      plural: "Puestos",
      createHandler: createPuesto,
      listHandler: listPuestos,
      detailHandler: getPuesto,
      updateHandler: updatePuesto,
      deleteHandler: deletePuesto,
    });
    expect(puestoControllers).toEqual({ stub: true });
  });
});
