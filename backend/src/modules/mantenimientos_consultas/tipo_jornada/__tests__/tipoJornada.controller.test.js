import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createTipoJornada = jest.fn();
const deleteTipoJornada = jest.fn();
const getTipoJornada = jest.fn();
const listTiposJornada = jest.fn();
const updateTipoJornada = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createTipoJornada }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteTipoJornada }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getTipoJornada, listTiposJornada }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateTipoJornada }));

const { tipoJornadaControllers } = await import("../controllers/tipo_jornada.controller.js");

describe("tipoJornadaControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Tipo de jornada",
			plural: "Tipos de jornada",
			createHandler: createTipoJornada,
			listHandler: listTiposJornada,
			detailHandler: getTipoJornada,
			updateHandler: updateTipoJornada,
			deleteHandler: deleteTipoJornada,
		});
		expect(tipoJornadaControllers).toEqual({ stub: true });
	});
});
