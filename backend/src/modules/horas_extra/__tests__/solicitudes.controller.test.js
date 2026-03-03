import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../common/strings.js";
import { createHttpMocks } from "../../../test-utils/httpMocks.js";

const crearSolicitudHoraExtra = jest.fn();
const actualizarSolicitudHoraExtra = jest.fn();
const obtenerSolicitudesHoraExtra = jest.fn();

jest.unstable_mockModule("../handlers/solicitudes/crearSolicitudHoraExtra.js", () => ({
	crearSolicitudHoraExtra,
}));

jest.unstable_mockModule("../handlers/solicitudes/actualizarSolicitudHoraExtra.js", () => ({
	actualizarSolicitudHoraExtra,
}));

jest.unstable_mockModule("../handlers/solicitudes/obtenerSolicitudesHoraExtra.js", () => ({
	obtenerSolicitudesHoraExtra,
}));

const {
	crearSolicitudHorasExtra,
	actualizarSolicitudHorasExtra,
	obtenerSolicitudesHorasExtra,
} = await import("../controllers/solicitudes.controller.js");

describe("solicitudes.controller", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("crearSolicitudHorasExtra responde 201 en éxito", async () => {
		const { req, res, next } = createHttpMocks({
			body: {
				id_colaborador: 11,
				fecha_trabajo: "2026-03-08",
				horas_solicitadas: 2,
				id_tipo_hx: 3,
				justificacion: "Cierre",
			},
		});
		crearSolicitudHoraExtra.mockResolvedValue({ id_solicitud_hx: 1 });

		await crearSolicitudHorasExtra(req, res, next);

		expect(crearSolicitudHoraExtra).toHaveBeenCalledWith({
			id_colaborador: 11,
			fecha_trabajo: "2026-03-08",
			horas_solicitadas: 2,
			id_tipo_hx: 3,
			justificacion: "Cierre",
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
		expect(next).not.toHaveBeenCalled();
	});

	test("crearSolicitudHorasExtra valida campos obligatorios", async () => {
		const casos = [
			[{ fecha_trabajo: "2026-03-08", horas_solicitadas: 1, id_tipo_hx: 1, justificacion: "ok" }, "id_colaborador es obligatorio"],
			[{ id_colaborador: 1, horas_solicitadas: 1, id_tipo_hx: 1, justificacion: "ok" }, "fecha_trabajo es obligatoria"],
			[{ id_colaborador: 1, fecha_trabajo: "2026-03-08", id_tipo_hx: 1, justificacion: "ok" }, "horas_solicitadas es obligatorio"],
			[{ id_colaborador: 1, fecha_trabajo: "2026-03-08", horas_solicitadas: 1, justificacion: "ok" }, "id_tipo_hx es obligatorio"],
			[{ id_colaborador: 1, fecha_trabajo: "2026-03-08", horas_solicitadas: 1, id_tipo_hx: 1 }, "justificacion es obligatoria"],
		];

		for (const [body, message] of casos) {
			const { req, res, next } = createHttpMocks({ body });
			await crearSolicitudHorasExtra(req, res, next);
			expect(next).toHaveBeenCalledWith(expect.objectContaining({ message }));
			res.status.mockClear();
			next.mockClear();
		}
	});

	test("actualizarSolicitudHorasExtra prioriza id de params y responde 200", async () => {
		const { req, res, next } = createHttpMocks({
			body: { id_solicitud_hx: 99, estado: "APROBADO" },
		});
		req.params = { id: "15" };
		actualizarSolicitudHoraExtra.mockResolvedValue({ id_solicitud_hx: 15 });

		await actualizarSolicitudHorasExtra(req, res, next);

		expect(actualizarSolicitudHoraExtra).toHaveBeenCalledWith({
			id_solicitud_hx: "15",
			fecha_trabajo: undefined,
			horas_solicitadas: undefined,
			id_tipo_hx: undefined,
			justificacion: undefined,
			estado: "APROBADO",
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});

	test("actualizarSolicitudHorasExtra usa id del body si params viene vacío", async () => {
		const { req, res, next } = createHttpMocks({ body: { id_solicitud_hx: "22", estado: "RECHAZADO" } });
		req.params = { id: "" };
		actualizarSolicitudHoraExtra.mockResolvedValue({ id_solicitud_hx: 22 });

		await actualizarSolicitudHorasExtra(req, res, next);

		expect(actualizarSolicitudHoraExtra).toHaveBeenCalledWith(expect.objectContaining({ id_solicitud_hx: "22" }));
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
	});

	test("actualizarSolicitudHorasExtra falla si no hay identificador", async () => {
		const { req, res, next } = createHttpMocks({ body: {} });
		req.params = {};

		await actualizarSolicitudHorasExtra(req, res, next);

		expect(next).toHaveBeenCalledWith(
			expect.objectContaining({ message: "El identificador de la solicitud es obligatorio" })
		);
		expect(res.status).not.toHaveBeenCalled();
	});

	test("obtenerSolicitudesHorasExtra responde 200", async () => {
		const { req, res, next } = createHttpMocks();
		req.query = { agrupamiento: "estado", estado: "PENDIENTE", id_colaborador: "5" };
		obtenerSolicitudesHoraExtra.mockResolvedValue({ total: 0, grupos: [] });

		await obtenerSolicitudesHorasExtra(req, res, next);

		expect(obtenerSolicitudesHoraExtra).toHaveBeenCalledWith({
			agrupamiento: "estado",
			estado: "PENDIENTE",
			id_colaborador: "5",
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});

	test("obtenerSolicitudesHorasExtra propaga errores por next", async () => {
		const { req, res, next } = createHttpMocks();
		req.query = {};
		const error = new Error("fallo obtener");
		obtenerSolicitudesHoraExtra.mockRejectedValue(error);

		await obtenerSolicitudesHorasExtra(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});

	test("propaga errores de handlers por next", async () => {
		const { req, res, next } = createHttpMocks({
			body: {
				id_colaborador: 1,
				fecha_trabajo: "2026-03-08",
				horas_solicitadas: 2,
				id_tipo_hx: 1,
				justificacion: "ok",
			},
		});
		const error = new Error("fallo interno");
		crearSolicitudHoraExtra.mockRejectedValue(error);

		await crearSolicitudHorasExtra(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});
});
