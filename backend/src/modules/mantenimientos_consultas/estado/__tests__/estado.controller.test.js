import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createEstado = jest.fn();
const deleteEstado = jest.fn();
const getEstado = jest.fn();
const listEstados = jest.fn();
const updateEstado = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createEstado }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteEstado }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getEstado, listEstados }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateEstado }));

const { estadoControllers } = await import("../controller/estado.controller.js");

describe("estadoControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Estado",
			plural: "Estados",
			createHandler: createEstado,
			listHandler: listEstados,
			detailHandler: getEstado,
			updateHandler: updateEstado,
			deleteHandler: deleteEstado,
		});
		expect(estadoControllers).toEqual({ stub: true });
	});
});
