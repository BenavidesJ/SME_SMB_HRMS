import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createFeriado = jest.fn();
const deleteFeriado = jest.fn();
const getFeriado = jest.fn();
const listFeriados = jest.fn();
const updateFeriado = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createFeriado }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteFeriado }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getFeriado, listFeriados }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateFeriado }));

const { feriadoControllers } = await import("../controllers/feriado.controller.js");

describe("feriadoControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Feriado",
			plural: "Feriados",
			createHandler: createFeriado,
			listHandler: listFeriados,
			detailHandler: getFeriado,
			updateHandler: updateFeriado,
			deleteHandler: deleteFeriado,
		});
		expect(feriadoControllers).toEqual({ stub: true });
	});
});
