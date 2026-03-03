import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../common/strings.js";
import { createHttpMocks } from "../../../test-utils/httpMocks.js";

const registrarIncapacidad = jest.fn();
const listarIncapacidadesPorColaborador = jest.fn();
const extenderIncapacidad = jest.fn();

jest.unstable_mockModule("../handlers/registrarIncapacidad.js", () => ({ registrarIncapacidad }));
jest.unstable_mockModule("../handlers/listarIncapacidadesPorColaborador.js", () => ({ listarIncapacidadesPorColaborador }));
jest.unstable_mockModule("../handlers/extenderIncapacidad.js", () => ({ extenderIncapacidad }));

const {
	registrarIncapacidadController,
	listarIncapacidadesPorColaboradorController,
	extenderIncapacidadController,
} = await import("../controllers/incapacidades.controller.js");

describe("incapacidades.controller", () => {
	beforeEach(() => jest.clearAllMocks());

	test("registrarIncapacidadController responde created", async () => {
		const { req, res, next } = createHttpMocks({ body: { id_colaborador: 10 } });
		registrarIncapacidad.mockResolvedValue({ grupo: "uuid" });

		await registrarIncapacidadController(req, res, next);

		expect(registrarIncapacidad).toHaveBeenCalledWith({ id_colaborador: 10 });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
		expect(next).not.toHaveBeenCalled();
	});

	test("listarIncapacidadesPorColaboradorController usa params.id o body", async () => {
		const { req, res, next } = createHttpMocks({ body: { id_colaborador: 10 } });
		req.params = { id: "10" };
		listarIncapacidadesPorColaborador.mockResolvedValue([]);

		await listarIncapacidadesPorColaboradorController(req, res, next);
		expect(listarIncapacidadesPorColaborador).toHaveBeenCalledWith({ id_colaborador: "10" });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});

	test("extenderIncapacidadController pasa params y body", async () => {
		const { req, res, next } = createHttpMocks({ body: { fecha_fin: "2026-03-20" } });
		req.params = { grupo: "uuid-1" };
		extenderIncapacidad.mockResolvedValue({ grupo: "uuid-1" });

		await extenderIncapacidadController(req, res, next);
		expect(extenderIncapacidad).toHaveBeenCalledWith({ grupo: "uuid-1", fecha_fin: "2026-03-20" });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
	});

	test("propaga errores por next", async () => {
		const { req, res, next } = createHttpMocks({ body: {} });
		const error = new Error("boom");
		registrarIncapacidad.mockRejectedValue(error);

		await registrarIncapacidadController(req, res, next);
		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});

	test("listarIncapacidadesPorColaboradorController propaga errores por next", async () => {
		const { req, res, next } = createHttpMocks({ body: { id_colaborador: 10 } });
		const error = new Error("listar-boom");
		listarIncapacidadesPorColaborador.mockRejectedValue(error);

		await listarIncapacidadesPorColaboradorController(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});

	test("extenderIncapacidadController propaga errores por next", async () => {
		const { req, res, next } = createHttpMocks({ body: { fecha_fin: "2026-03-20" } });
		req.params = { grupo: "uuid-1" };
		const error = new Error("extender-boom");
		extenderIncapacidad.mockRejectedValue(error);

		await extenderIncapacidadController(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});
});
