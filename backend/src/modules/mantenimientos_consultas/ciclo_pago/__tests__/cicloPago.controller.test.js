import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createCicloPago = jest.fn();
const deleteCicloPago = jest.fn();
const getCicloPago = jest.fn();
const listCiclosPago = jest.fn();
const updateCicloPago = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createCicloPago }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteCicloPago }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getCicloPago, listCiclosPago }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateCicloPago }));

const { cicloPagoControllers } = await import("../controllers/ciclo_pago.controller.js");

describe("cicloPagoControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Ciclo de pago",
			plural: "Ciclos de pago",
			createHandler: createCicloPago,
			listHandler: listCiclosPago,
			detailHandler: getCicloPago,
			updateHandler: updateCicloPago,
			deleteHandler: deleteCicloPago,
		});
		expect(cicloPagoControllers).toEqual({ stub: true });
	});
});
