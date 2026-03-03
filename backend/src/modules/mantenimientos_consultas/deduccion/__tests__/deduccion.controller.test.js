import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createDeduccion = jest.fn();
const deleteDeduccion = jest.fn();
const getDeduccion = jest.fn();
const listDeducciones = jest.fn();
const updateDeduccion = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createDeduccion }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteDeduccion }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getDeduccion, listDeducciones }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateDeduccion }));

const { deduccionControllers } = await import("../controllers/deduccion.controller.js");

describe("deduccionControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Deducción",
			plural: "Deducciones",
			createHandler: createDeduccion,
			listHandler: listDeducciones,
			detailHandler: getDeduccion,
			updateHandler: updateDeduccion,
			deleteHandler: deleteDeduccion,
		});
		expect(deduccionControllers).toEqual({ stub: true });
	});
});
