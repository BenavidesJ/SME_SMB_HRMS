import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createTipoMarca = jest.fn();
const deleteTipoMarca = jest.fn();
const getTipoMarca = jest.fn();
const listTiposMarca = jest.fn();
const updateTipoMarca = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createTipoMarca }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteTipoMarca }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getTipoMarca, listTiposMarca }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateTipoMarca }));

const { tipoMarcaControllers } = await import("../controllers/tipo_marca.controller.js");

describe("tipoMarcaControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Tipo de marca",
			plural: "Tipos de marca",
			createHandler: createTipoMarca,
			listHandler: listTiposMarca,
			detailHandler: getTipoMarca,
			updateHandler: updateTipoMarca,
			deleteHandler: deleteTipoMarca,
		});
		expect(tipoMarcaControllers).toEqual({ stub: true });
	});
});
