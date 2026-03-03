import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createDepartamento = jest.fn();
const deleteDepartamento = jest.fn();
const getDepartamento = jest.fn();
const listDepartamentos = jest.fn();
const updateDepartamento = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
  buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createDepartamento }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteDepartamento }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getDepartamento, listDepartamentos }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateDepartamento }));

const { departamentoControllers } = await import("../controllers/departamento.controller.js");

describe("departamentoControllers", () => {
  test("construye CRUD controllers con handlers y labels correctos", () => {
    expect(buildCrudControllers).toHaveBeenCalledWith({
      singular: "Departamento",
      plural: "Departamentos",
      createHandler: createDepartamento,
      listHandler: listDepartamentos,
      detailHandler: getDepartamento,
      updateHandler: updateDepartamento,
      deleteHandler: deleteDepartamento,
    });
    expect(departamentoControllers).toEqual({ stub: true });
  });
});
