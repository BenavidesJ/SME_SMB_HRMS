import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createTipoContrato = jest.fn();
const deleteTipoContrato = jest.fn();
const getTipoContrato = jest.fn();
const listTiposContrato = jest.fn();
const updateTipoContrato = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createTipoContrato }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteTipoContrato }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getTipoContrato, listTiposContrato }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateTipoContrato }));

const { tipoContratoControllers } = await import("../controllers/tipo_contrato.controller.js");

describe("tipoContratoControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Tipo de contrato",
			plural: "Tipos de contrato",
			createHandler: createTipoContrato,
			listHandler: listTiposContrato,
			detailHandler: getTipoContrato,
			updateHandler: updateTipoContrato,
			deleteHandler: deleteTipoContrato,
		});
		expect(tipoContratoControllers).toEqual({ stub: true });
	});
});
