import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../common/strings.js";
import { createHttpMocks } from "../../../test-utils/httpMocks.js";
import { createPermisosVacacionesModelMocks } from "../../../test-utils/permisosVacacionesModelMocks.js";

const solicitarVacaciones = jest.fn();
const listarVacacionesPorColaborador = jest.fn();
const actualizarEstadoSolicitudVacaciones = jest.fn();

const { Usuario, reset } = createPermisosVacacionesModelMocks();

jest.unstable_mockModule("../handlers/solicitarVacaciones.js", () => ({
	solicitarVacaciones,
}));

jest.unstable_mockModule("../handlers/listarVacacionesPorColaborador.js", () => ({
	listarVacacionesPorColaborador,
}));

jest.unstable_mockModule("../handlers/actualizarEstadoSolicitudVacaciones.js", () => ({
	actualizarEstadoSolicitudVacaciones,
}));

jest.unstable_mockModule("../../../models/index.js", () => ({
	Usuario,
}));

const {
	solicitarVacacionesController,
	listarVacacionesPorColaboradorController,
	actualizarEstadoSolicitudVacacionesController,
} = await import("../controllers/vacaciones.controller.js");

describe("vacaciones.controller", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("solicitarVacacionesController crea solicitud", async () => {
		const { req, res, next } = createHttpMocks({
			user: { id: 90 },
			body: {
				id_colaborador: 10,
				id_aprobador: 3,
				fecha_inicio: "2026-03-10",
				fecha_fin: "2026-03-12",
			},
		});
		Usuario.findByPk.mockResolvedValue({ id_usuario: 90, id_colaborador: 10 });
		solicitarVacaciones.mockResolvedValue({ id_solicitud_vacaciones: 1 });

		await solicitarVacacionesController(req, res, next);

		expect(solicitarVacaciones).toHaveBeenCalledWith(expect.objectContaining({ id_colaborador: 10 }));
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
		expect(next).not.toHaveBeenCalled();
	});

	test("solicitarVacacionesController valida colaborador actor", async () => {
		const { req, res, next } = createHttpMocks({ user: { id: 90 }, body: { id_colaborador: 11 } });
		Usuario.findByPk.mockResolvedValue({ id_usuario: 90, id_colaborador: 10 });

		await solicitarVacacionesController(req, res, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "No puedes crear solicitudes para otro colaborador" }));
	});

	test("listarVacacionesPorColaboradorController aplica aprobador_filter por actor", async () => {
		const { req, res, next } = createHttpMocks({ user: { id: 90 } });
		req.params = { id_colaborador: "10" };
		Usuario.findByPk.mockResolvedValue({ id_usuario: 90, id_colaborador: 3 });
		listarVacacionesPorColaborador.mockResolvedValue([]);

		await listarVacacionesPorColaboradorController(req, res, next);

		expect(listarVacacionesPorColaborador).toHaveBeenCalledWith({ id_colaborador: 10, aprobador_filter: 3 });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
	});

	test("actualizarEstadoSolicitudVacacionesController pasa datos al handler", async () => {
		const { req, res, next } = createHttpMocks({ user: { id: 90 }, body: { nuevo_estado: "APROBADO" } });
		req.params = { id: "7" };
		Usuario.findByPk.mockResolvedValue({ id_usuario: 90, id_colaborador: 3 });
		actualizarEstadoSolicitudVacaciones.mockResolvedValue({ id_solicitud_vacaciones: 7, estado_solicitud: "APROBADO" });

		await actualizarEstadoSolicitudVacacionesController(req, res, next);

		expect(actualizarEstadoSolicitudVacaciones).toHaveBeenCalledWith({
			id_solicitud_vacaciones: "7",
			nuevo_estado: "APROBADO",
			id_usuario_actor: 90,
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
	});

	test("resolveActorFromToken fallback por id_colaborador", async () => {
		const { req, res, next } = createHttpMocks({ user: { id: 10 }, body: { id_colaborador: 10 } });
		Usuario.findByPk.mockResolvedValue(null);
		Usuario.findOne.mockResolvedValue({ id_usuario: 90, id_colaborador: 10 });
		solicitarVacaciones.mockResolvedValue({ id_solicitud_vacaciones: 1 });

		await solicitarVacacionesController(req, res, next);

		expect(Usuario.findOne).toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});

	test("propaga errores por next", async () => {
		const { req, res, next } = createHttpMocks({ user: { id: "x" }, body: { id_colaborador: 10 } });

		await solicitarVacacionesController(req, res, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "No se pudo identificar al usuario autenticado" }));
		expect(res.status).not.toHaveBeenCalled();
	});
});
