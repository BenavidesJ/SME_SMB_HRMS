import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../common/strings.js";
import { createHttpMocks } from "../../../test-utils/httpMocks.js";
import { createPermisosVacacionesModelMocks } from "../../../test-utils/permisosVacacionesModelMocks.js";

const solicitarPermiso = jest.fn();
const actualizarEstadoSolicitudPermiso = jest.fn();
const listarPermisosPorColaborador = jest.fn();

const { Usuario, reset } = createPermisosVacacionesModelMocks();

jest.unstable_mockModule("../handlers/solicitarPermiso.js", () => ({
	solicitarPermiso,
}));

jest.unstable_mockModule("../handlers/actualizarEstadoSolicitudPermiso.js", () => ({
	actualizarEstadoSolicitudPermiso,
}));

jest.unstable_mockModule("../handlers/listarPermisosPorColaborador.js", () => ({
	listarPermisosPorColaborador,
}));

jest.unstable_mockModule("../../../models/index.js", () => ({
	Usuario,
}));

const {
	solicitarPermisoController,
	actualizarEstadoSolicitudPermisoController,
	listarPermisosPorColaboradorController,
} = await import("../controllers/permisos.controller.js");

describe("permisos.controller", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("solicitarPermisoController crea solicitud", async () => {
		const { req, res, next } = createHttpMocks({
			body: {
				id_colaborador: 10,
				id_aprobador: 3,
				tipo_permiso: "GOCE",
				fecha_inicio: "2026-03-10",
				fecha_fin: "2026-03-12",
			},
			user: { id: 99 },
		});
		Usuario.findByPk.mockResolvedValue({ id_usuario: 99, id_colaborador: 10 });
		solicitarPermiso.mockResolvedValue({ id_solicitud: 44 });

		await solicitarPermisoController(req, res, next);

		expect(solicitarPermiso).toHaveBeenCalledWith(expect.objectContaining({ id_colaborador: 10 }));
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
		expect(next).not.toHaveBeenCalled();
	});

	test("solicitarPermisoController falla si intenta crear para otro colaborador", async () => {
		const { req, res, next } = createHttpMocks({
			body: { id_colaborador: 11 },
			user: { id: 99 },
		});
		Usuario.findByPk.mockResolvedValue({ id_usuario: 99, id_colaborador: 10 });

		await solicitarPermisoController(req, res, next);

		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "No puedes crear solicitudes para otro colaborador" }));
		expect(res.status).not.toHaveBeenCalled();
	});

	test("resolveActorFromToken usa fallback por id_colaborador", async () => {
		const { req, res, next } = createHttpMocks({
			body: { id_colaborador: 10, id_aprobador: 3, tipo_permiso: "GOCE", fecha_inicio: "2026-03-10", fecha_fin: "2026-03-12" },
			user: { id: 10 },
		});
		Usuario.findByPk.mockResolvedValue(null);
		Usuario.findOne.mockResolvedValue({ id_usuario: 88, id_colaborador: 10 });
		solicitarPermiso.mockResolvedValue({ id_solicitud: 55 });

		await solicitarPermisoController(req, res, next);

		expect(Usuario.findOne).toHaveBeenCalled();
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.CREATED);
	});

	test("actualizarEstadoSolicitudPermisoController pasa actor y payload", async () => {
		const { req, res, next } = createHttpMocks({ body: { nuevo_estado: "APROBADO" }, user: { id: 99 } });
		req.params = { id: "77" };
		Usuario.findByPk.mockResolvedValue({ id_usuario: 99, id_colaborador: 3 });
		actualizarEstadoSolicitudPermiso.mockResolvedValue({ id_solicitud: 77, estado_solicitud: "APROBADO" });

		await actualizarEstadoSolicitudPermisoController(req, res, next);

		expect(actualizarEstadoSolicitudPermiso).toHaveBeenCalledWith({
			id_solicitud_permiso: "77",
			nuevo_estado: "APROBADO",
			id_usuario_actor: 99,
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
	});

	test("listarPermisosPorColaboradorController aplica aprobador_filter si actor != target", async () => {
		const { req, res, next } = createHttpMocks({ user: { id: 99 } });
		req.params = { id_colaborador: "10" };
		Usuario.findByPk.mockResolvedValue({ id_usuario: 99, id_colaborador: 3 });
		listarPermisosPorColaborador.mockResolvedValue([]);

		await listarPermisosPorColaboradorController(req, res, next);

		expect(listarPermisosPorColaborador).toHaveBeenCalledWith({ id_colaborador: 10, aprobador_filter: 3 });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});

	test("listarPermisosPorColaboradorController usa aprobador_filter null cuando actor==target", async () => {
		const { req, res, next } = createHttpMocks({ user: { id: 99 } });
		req.params = { id: "10" };
		Usuario.findByPk.mockResolvedValue({ id_usuario: 99, id_colaborador: 10 });
		listarPermisosPorColaborador.mockResolvedValue([]);

		await listarPermisosPorColaboradorController(req, res, next);

		expect(listarPermisosPorColaborador).toHaveBeenCalledWith({ id_colaborador: 10, aprobador_filter: null });
		expect(next).not.toHaveBeenCalled();
	});

	test("propaga errores por next", async () => {
		const { req, res, next } = createHttpMocks({
			body: { id_colaborador: 10 },
			user: { id: "x" },
		});

		await solicitarPermisoController(req, res, next);
		expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "No se pudo identificar al usuario autenticado" }));
		expect(res.status).not.toHaveBeenCalled();
	});
});
