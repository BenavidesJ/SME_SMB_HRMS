import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createTipoIncapacidad = jest.fn();
const deleteTipoIncapacidad = jest.fn();
const getTipoIncapacidad = jest.fn();
const listTiposIncapacidad = jest.fn();
const updateTipoIncapacidad = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createTipoIncapacidad }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteTipoIncapacidad }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getTipoIncapacidad, listTiposIncapacidad }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateTipoIncapacidad }));

const { tipoIncapacidadControllers } = await import("../controllers/tipo_incapacidad.controller.js");

describe("tipoIncapacidadControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Tipo de incapacidad",
			plural: "Tipos de incapacidad",
			createHandler: createTipoIncapacidad,
			listHandler: listTiposIncapacidad,
			detailHandler: getTipoIncapacidad,
			updateHandler: updateTipoIncapacidad,
			deleteHandler: deleteTipoIncapacidad,
		});
		expect(tipoIncapacidadControllers).toEqual({ stub: true });
	});
});
