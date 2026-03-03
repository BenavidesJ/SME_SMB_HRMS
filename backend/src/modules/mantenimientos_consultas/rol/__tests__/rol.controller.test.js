import { jest } from "@jest/globals";

const buildCrudControllers = jest.fn(() => ({ stub: true }));
const createRol = jest.fn();
const deleteRol = jest.fn();
const getRol = jest.fn();
const listRoles = jest.fn();
const updateRol = jest.fn();

jest.unstable_mockModule("../../shared/controllerFactory.js", () => ({
	buildCrudControllers,
}));

jest.unstable_mockModule("../handlers/create.js", () => ({ createRol }));
jest.unstable_mockModule("../handlers/delete.js", () => ({ deleteRol }));
jest.unstable_mockModule("../handlers/read.js", () => ({ getRol, listRoles }));
jest.unstable_mockModule("../handlers/update.js", () => ({ updateRol }));

const { rolControllers } = await import("../controllers/rol.controller.js");

describe("rolControllers", () => {
	test("construye CRUD controllers con handlers y labels correctos", () => {
		expect(buildCrudControllers).toHaveBeenCalledWith({
			singular: "Rol",
			plural: "Roles",
			createHandler: createRol,
			listHandler: listRoles,
			detailHandler: getRol,
			updateHandler: updateRol,
			deleteHandler: deleteRol,
		});
		expect(rolControllers).toEqual({ stub: true });
	});
});
