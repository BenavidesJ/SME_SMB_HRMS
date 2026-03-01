import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../common/strings.js";
import { createHttpMocks } from "../../../test-utils/httpMocks.js";

const registrarMarcaAsistencia = jest.fn();
const obtenerMarcasDeDia = jest.fn();
const obtenerMarcasAsistenciaPorRango = jest.fn();
const actualizarMarcaAsistencia = jest.fn();

jest.unstable_mockModule("../handlers/realizarMarca.js", () => ({
	registrarMarcaAsistencia,
}));

jest.unstable_mockModule("../handlers/consultarMarcasDia.js", () => ({
	obtenerMarcasDeDia,
}));

jest.unstable_mockModule("../handlers/obtenerMarcasRango.js", () => ({
	obtenerMarcasAsistenciaPorRango,
}));

jest.unstable_mockModule("../handlers/actualizarMarca.js", () => ({
	actualizarMarcaAsistencia,
}));

const {
	marcarAsistencia,
	obtenerEstadoMarcasDia,
	obtenerMarcasPorRango,
	patchMarcaAsistencia,
} = await import("../controllers/asistencia.controller.js");

describe("asistencia.controller", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("marcarAsistencia responde CREATED en éxito", async () => {
		registrarMarcaAsistencia.mockResolvedValue({ id_marca: 99 });
		const { req, res, next } = createHttpMocks({
			body: { identificacion: "123", tipo_marca: "ENTRADA", timestamp: "2026-03-01T08:00:00" },
		});

		await marcarAsistencia(req, res, next);

		expect(registrarMarcaAsistencia).toHaveBeenCalledWith({
			identificacion: "123",
			tipo_marca: "ENTRADA",
			timestamp: "2026-03-01T08:00:00",
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
		expect(next).not.toHaveBeenCalled();
	});

	test("marcarAsistencia valida identificación obligatoria", async () => {
		const { req, res, next } = createHttpMocks({
			body: { tipo_marca: "ENTRADA", timestamp: "2026-03-01T08:00:00" },
		});

		await marcarAsistencia(req, res, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "La identificación es obligatoria" }));
		expect(res.status).not.toHaveBeenCalled();
	});

	test("marcarAsistencia valida tipo de marca obligatorio", async () => {
		const { req, next } = createHttpMocks({
			body: { identificacion: "123", timestamp: "2026-03-01T08:00:00" },
		});

		await marcarAsistencia(req, { status: jest.fn(), json: jest.fn() }, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "El tipo de marca es obligatorio" }));
	});

	test("marcarAsistencia valida timestamp obligatorio", async () => {
		const { req, next } = createHttpMocks({
			body: { identificacion: "123", tipo_marca: "ENTRADA" },
		});

		await marcarAsistencia(req, { status: jest.fn(), json: jest.fn() }, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "El timestamp es obligatorio" }));
	});

	test("obtenerEstadoMarcasDia responde OK", async () => {
		obtenerMarcasDeDia.mockResolvedValue({ estado_marcas: "SIN_MARCAS" });
		const { req, res, next } = createHttpMocks();
		req.query = { identificacion: "123", timestamp: "2026-03-01T08:00:00" };

		await obtenerEstadoMarcasDia(req, res, next);

		expect(obtenerMarcasDeDia).toHaveBeenCalledWith({ identificacion: "123", timestamp: "2026-03-01T08:00:00" });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});

	test("obtenerEstadoMarcasDia valida timestamp obligatorio", async () => {
		const { req, next } = createHttpMocks();
		req.query = { identificacion: "123", timestamp: "" };

		await obtenerEstadoMarcasDia(req, { status: jest.fn(), json: jest.fn() }, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "El timestamp es obligatorio" }));
	});

	test("obtenerEstadoMarcasDia valida identificación obligatoria", async () => {
		const { req, next } = createHttpMocks();
		req.query = { identificacion: "", timestamp: "2026-03-01T08:00:00" };

		await obtenerEstadoMarcasDia(req, { status: jest.fn(), json: jest.fn() }, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "La identificación es obligatoria" }));
	});

	test("obtenerMarcasPorRango valida desde obligatorio", async () => {
		const { req, res, next } = createHttpMocks();
		req.query = { identificacion: "123", hasta: "2026-03-10" };

		await obtenerMarcasPorRango(req, res, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ message: "desde es obligatorio (YYYY-MM-DD)" })
		);
		expect(res.status).not.toHaveBeenCalled();
	});

	test("obtenerMarcasPorRango valida identificación obligatoria", async () => {
		const { req, next } = createHttpMocks();
		req.query = { desde: "2026-03-01", hasta: "2026-03-10" };

		await obtenerMarcasPorRango(req, { status: jest.fn(), json: jest.fn() }, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "La identificación es obligatoria" }));
	});

	test("obtenerMarcasPorRango valida hasta obligatorio", async () => {
		const { req, next } = createHttpMocks();
		req.query = { identificacion: "123", desde: "2026-03-01", hasta: "" };

		await obtenerMarcasPorRango(req, { status: jest.fn(), json: jest.fn() }, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ message: "hasta es obligatorio (YYYY-MM-DD)" })
		);
	});

	test("obtenerMarcasPorRango responde OK", async () => {
		obtenerMarcasAsistenciaPorRango.mockResolvedValue({ total: 2 });
		const { req, res, next } = createHttpMocks();
		req.query = { identificacion: "123", desde: "2026-03-01", hasta: "2026-03-10", tipo_marca: "ENTRADA" };

		await obtenerMarcasPorRango(req, res, next);

		expect(obtenerMarcasAsistenciaPorRango).toHaveBeenCalledWith({
			identificacion: "123",
			desde: "2026-03-01",
			hasta: "2026-03-10",
			tipo_marca: "ENTRADA",
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});

	test("patchMarcaAsistencia permite actualización por observaciones", async () => {
		actualizarMarcaAsistencia.mockResolvedValue({ ok: true });
		const { req, res, next } = createHttpMocks({
			body: {
				identificacion: "123",
				tipo_marca: "ENTRADA",
				timestamp: "2026-03-01T08:00:00",
				observaciones: "Corrección manual",
			},
		});

		await patchMarcaAsistencia(req, res, next);

		expect(actualizarMarcaAsistencia).toHaveBeenCalledWith({
			identificacion: "123",
			tipo_marca: "ENTRADA",
			timestamp: "2026-03-01T08:00:00",
			nuevo_timestamp: undefined,
			observaciones: "Corrección manual",
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});

	test("patchMarcaAsistencia valida que exista timestamp u observaciones", async () => {
		const { req, res, next } = createHttpMocks({
			body: { identificacion: "123", tipo_marca: "ENTRADA", timestamp: "2026-03-01T08:00:00" },
		});

		await patchMarcaAsistencia(req, res, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Debes proporcionar un nuevo timestamp u observaciones para actualizar",
			})
		);
	});

	test("patchMarcaAsistencia valida tipo_marca obligatorio", async () => {
		const { req, next } = createHttpMocks({
			body: { identificacion: "123", timestamp: "2026-03-01T08:00:00", nuevo_timestamp: "2026-03-01T08:05:00" },
		});

		await patchMarcaAsistencia(req, { status: jest.fn(), json: jest.fn() }, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "El tipo de marca es obligatorio" }));
	});

	test("patchMarcaAsistencia valida identificación obligatoria", async () => {
		const { req, next } = createHttpMocks({
			body: { tipo_marca: "ENTRADA", timestamp: "2026-03-01T08:00:00", nuevo_timestamp: "2026-03-01T08:05:00" },
		});

		await patchMarcaAsistencia(req, { status: jest.fn(), json: jest.fn() }, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "La identificación es obligatoria" }));
	});

	test("patchMarcaAsistencia valida timestamp original obligatorio", async () => {
		const { req, next } = createHttpMocks({
			body: { identificacion: "123", tipo_marca: "ENTRADA", nuevo_timestamp: "2026-03-01T08:05:00" },
		});

		await patchMarcaAsistencia(req, { status: jest.fn(), json: jest.fn() }, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ message: "El timestamp original es obligatorio" })
		);
	});

	test("patchMarcaAsistencia propaga error por next", async () => {
		const error = new Error("falló actualización");
		actualizarMarcaAsistencia.mockRejectedValue(error);
		const { req, res, next } = createHttpMocks({
			body: {
				identificacion: "123",
				tipo_marca: "SALIDA",
				timestamp: "2026-03-01T17:00:00",
				nuevo_timestamp: "2026-03-01T17:05:00",
			},
		});

		await patchMarcaAsistencia(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});
});
