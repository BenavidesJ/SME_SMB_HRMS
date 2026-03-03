import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createCausaLiquidacion = jest.fn();
const deleteCausaLiquidacion = jest.fn();
const getCausaLiquidacion = jest.fn();
const listCausasLiquidacion = jest.fn();
const updateCausaLiquidacion = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createCausaLiquidacion }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteCausaLiquidacion }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getCausaLiquidacion, listCausasLiquidacion }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateCausaLiquidacion }));

const { causaLiquidacionControllers } = await import("../controllers/causa_liquidacion.controller.js");

describe("causaLiquidacionControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Causa de liquidación",
			plural: "Causas de liquidación",
			createHandler: createCausaLiquidacion,
			listHandler: listCausasLiquidacion,
			detailHandler: getCausaLiquidacion,
			updateHandler: updateCausaLiquidacion,
			deleteHandler: deleteCausaLiquidacion,
		});
		expect(causaLiquidacionControllers).toEqual({ stub: true });
	});
});
