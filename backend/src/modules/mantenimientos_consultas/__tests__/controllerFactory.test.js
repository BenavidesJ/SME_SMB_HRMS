import { jest } from "@jest/globals";
import { createHttpMocks } from "../../../test-utils/httpMocks.js";
import { HTTP_CODES } from "../../../common/strings.js";
import { buildCrudControllers } from "../shared/controllerFactory.js";

describe("buildCrudControllers", () => {
	const createHandler = jest.fn();
	const listHandler = jest.fn();
	const detailHandler = jest.fn();
	const updateHandler = jest.fn();
	const deleteHandler = jest.fn();

	const controllers = buildCrudControllers({
		singular: "Empleado",
		plural: "Empleados",
		createHandler,
		listHandler,
		detailHandler,
		updateHandler,
		deleteHandler,
	});

	beforeEach(() => jest.clearAllMocks());

	test("create/list/detail/update/delete success flows", async () => {
		createHandler.mockResolvedValue({ id: 1 });
		listHandler.mockResolvedValue([{ id: 1 }]);
		detailHandler.mockResolvedValue({ id: 1 });
		updateHandler.mockResolvedValue({ id: 1, nombre: "x" });
		deleteHandler.mockResolvedValue({ deleted: true });

		let ctx = createHttpMocks({ body: { nombre: "A" } });
		await controllers.createController(ctx.req, ctx.res, ctx.next);
		expect(ctx.res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);

		ctx = createHttpMocks();
		ctx.req.query = { q: "a" };
		await controllers.listController(ctx.req, ctx.res, ctx.next);
		expect(ctx.res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);

		ctx = createHttpMocks();
		ctx.req.params = { id: "2" };
		ctx.req.query = {};
		await controllers.detailController(ctx.req, ctx.res, ctx.next);
		expect(detailHandler).toHaveBeenCalledWith({ id: "2", query: {} });

		ctx = createHttpMocks({ body: { nombre: "Z" } });
		ctx.req.params = { id: "2" };
		await controllers.updateController(ctx.req, ctx.res, ctx.next);
		expect(updateHandler).toHaveBeenCalledWith({ id: "2", patch: { nombre: "Z" } });

		ctx = createHttpMocks();
		ctx.req.params = { id: "2" };
		await controllers.deleteController(ctx.req, ctx.res, ctx.next);
		expect(deleteHandler).toHaveBeenCalledWith({ id: "2" });
	});

	test("list controller without listHandler returns []", async () => {
		const c = buildCrudControllers({
			singular: "X",
			plural: "Xs",
			createHandler,
			detailHandler,
			updateHandler,
			deleteHandler,
		});
		const { req, res, next } = createHttpMocks();
		await c.listController(req, res, next);
		expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [] }));
	});

	test("propaga errores por next", async () => {
		const err = new Error("boom");
		createHandler.mockRejectedValue(err);
		const { req, res, next } = createHttpMocks({ body: {} });
		await controllers.createController(req, res, next);
		expect(next).toHaveBeenCalledWith(err);
		expect(res.status).not.toHaveBeenCalled();
	});
});
