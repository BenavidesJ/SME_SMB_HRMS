import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createEstadoCivil = jest.fn();
const deleteEstadoCivil = jest.fn();
const getEstadoCivil = jest.fn();
const listEstadosCiviles = jest.fn();
const updateEstadoCivil = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createEstadoCivil }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteEstadoCivil }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getEstadoCivil, listEstadosCiviles }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateEstadoCivil }));

const { estadoCivilControllers } = await import("../controllers/estado_civil.controller.js");

describe("estadoCivilControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Estado civil",
			plural: "Estados civiles",
			createHandler: createEstadoCivil,
			listHandler: listEstadosCiviles,
			detailHandler: getEstadoCivil,
			updateHandler: updateEstadoCivil,
			deleteHandler: deleteEstadoCivil,
		});
		expect(estadoCivilControllers).toEqual({ stub: true });
	});
});
