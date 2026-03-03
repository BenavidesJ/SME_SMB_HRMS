import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createTipoHoraExtra = jest.fn();
const deleteTipoHoraExtra = jest.fn();
const getTipoHoraExtra = jest.fn();
const listTiposHoraExtra = jest.fn();
const updateTipoHoraExtra = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createTipoHoraExtra }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteTipoHoraExtra }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getTipoHoraExtra, listTiposHoraExtra }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateTipoHoraExtra }));

const { tipoHoraExtraControllers } = await import("../controllers/tipo_hora_extra.controller.js");

describe("tipoHoraExtraControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Tipo de hora extra",
			plural: "Tipos de hora extra",
			createHandler: createTipoHoraExtra,
			listHandler: listTiposHoraExtra,
			detailHandler: getTipoHoraExtra,
			updateHandler: updateTipoHoraExtra,
			deleteHandler: deleteTipoHoraExtra,
		});
		expect(tipoHoraExtraControllers).toEqual({ stub: true });
	});
});
