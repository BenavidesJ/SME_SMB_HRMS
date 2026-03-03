import { jest } from "@jest/globals";
import dayjs from "dayjs";
import { createPermisosVacacionesModelMocks } from "../../../test-utils/permisosVacacionesModelMocks.js";

const {
	sequelize,
	transaction,
	SolicitudPermisos,
	SolicitudVacaciones,
	JornadaDiaria,
	Usuario,
	Colaborador,
	Contrato,
	HorarioLaboral,
	reset,
} = createPermisosVacacionesModelMocks();

const sendEmail = jest.fn();
const plantillaNotificacionSolicitud = jest.fn();

const assertId = jest.fn();
const assertDate = jest.fn();
const listDatesInclusive = jest.fn();
const fetchEstadoId = jest.fn();
const collectConflictDates = jest.fn();
const splitDatesBySchedule = jest.fn();

jest.unstable_mockModule("../../../models/index.js", () => ({
	sequelize,
	SolicitudPermisos,
	SolicitudVacaciones,
	JornadaDiaria,
	Usuario,
	Colaborador,
	Contrato,
	HorarioLaboral,
}));

jest.unstable_mockModule("../../../services/mail.js", () => ({ sendEmail }));

jest.unstable_mockModule("../../../common/plantillasEmail/emailTemplate.js", () => ({
	plantillaNotificacionSolicitud,
}));

jest.unstable_mockModule("../../vacaciones/handlers/utils/vacacionesUtils.js", () => ({
	assertId,
	assertDate,
	listDatesInclusive,
	fetchEstadoId,
	collectConflictDates,
	splitDatesBySchedule,
}));

const { actualizarEstadoSolicitudPermiso } = await import("../handlers/actualizarEstadoSolicitudPermiso.js");

const buildSolicitud = (overrides = {}) => {
	const row = {
		id_solicitud: 50,
		id_colaborador: 10,
		id_aprobador: 3,
		estado_solicitud: 2,
		fecha_inicio: "2026-03-10",
		fecha_fin: "2026-03-12",
		...overrides,
	};
	row.update = jest.fn(async (patch) => Object.assign(row, patch));
	return row;
};

const setupApproveHappy = () => {
	assertId.mockImplementation((value) => Number(value));
	assertDate.mockImplementation((value) => dayjs(String(value), "YYYY-MM-DD", true));
	listDatesInclusive.mockReturnValue(["2026-03-10", "2026-03-11", "2026-03-12"]);
	fetchEstadoId
		.mockResolvedValueOnce(2)
		.mockResolvedValueOnce(3)
		.mockResolvedValueOnce(4)
		.mockResolvedValueOnce(1);
	collectConflictDates.mockReturnValue(new Set());
	splitDatesBySchedule.mockReturnValue({
		workingDates: ["2026-03-10", "2026-03-11"],
		restDates: ["2026-03-12"],
	});
	Usuario.findByPk.mockResolvedValue({ id_usuario: 100, id_colaborador: 3 });
	SolicitudPermisos.findByPk.mockResolvedValue(buildSolicitud());
	Colaborador.findByPk.mockResolvedValue({ id_colaborador: 10, nombre: "Ana", correo_electronico: "ana@empresa.com" });
	Contrato.findOne.mockResolvedValue({ id_contrato: 9 });
	HorarioLaboral.findOne.mockResolvedValue({ id_horario: 1 });
	SolicitudPermisos.findAll.mockResolvedValue([]);
	SolicitudVacaciones.findAll.mockResolvedValue([]);
	JornadaDiaria.findAll.mockResolvedValue([]);
	JornadaDiaria.create.mockResolvedValue({});
	sendEmail.mockResolvedValue(undefined);
	plantillaNotificacionSolicitud.mockReturnValue("html");
};

describe("actualizarEstadoSolicitudPermiso", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("valida nuevo_estado permitido", async () => {
		assertId.mockImplementation((value) => Number(value));
		await expect(actualizarEstadoSolicitudPermiso({ id_solicitud_permiso: 1, id_usuario_actor: 1, nuevo_estado: "OTRO" })).rejects.toThrow(
			"nuevo_estado debe ser APROBADO o RECHAZADO"
		);
		expect(sequelize.transaction).not.toHaveBeenCalled();
	});

	test("falla si usuario actor no existe", async () => {
		assertId.mockImplementation((value) => Number(value));
		fetchEstadoId.mockResolvedValue(1);
		Usuario.findByPk.mockResolvedValue(null);

		await expect(
			actualizarEstadoSolicitudPermiso({ id_solicitud_permiso: 50, id_usuario_actor: 100, nuevo_estado: "APROBADO" })
		).rejects.toThrow("No existe el usuario con id 100");
	});

	test("falla cuando solicitud no existe", async () => {
		assertId.mockImplementation((value) => Number(value));
		fetchEstadoId
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(3)
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(1);
		Usuario.findByPk.mockResolvedValue({ id_usuario: 100, id_colaborador: 3 });
		SolicitudPermisos.findByPk.mockResolvedValue(null);

		await expect(
			actualizarEstadoSolicitudPermiso({ id_solicitud_permiso: 50, id_usuario_actor: 100, nuevo_estado: "APROBADO" })
		).rejects.toThrow("No existe la solicitud de permiso 50");
	});

	test("falla cuando solicitud no está en PENDIENTE", async () => {
		assertId.mockImplementation((value) => Number(value));
		fetchEstadoId
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(3)
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(1);
		Usuario.findByPk.mockResolvedValue({ id_usuario: 100, id_colaborador: 3 });
		SolicitudPermisos.findByPk.mockResolvedValue(buildSolicitud({ estado_solicitud: 3 }));
		await expect(
			actualizarEstadoSolicitudPermiso({ id_solicitud_permiso: 50, id_usuario_actor: 100, nuevo_estado: "APROBADO" })
		).rejects.toThrow("Solo se pueden cambiar solicitudes en estado PENDIENTE");
 	});

	test("falla cuando actor no es aprobador asignado", async () => {
		assertId.mockImplementation((value) => Number(value));
		fetchEstadoId
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(3)
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(1);
		Usuario.findByPk.mockResolvedValue({ id_usuario: 100, id_colaborador: 3 });
		SolicitudPermisos.findByPk.mockResolvedValue(buildSolicitud({ estado_solicitud: 2, id_aprobador: 9 }));
		await expect(
			actualizarEstadoSolicitudPermiso({ id_solicitud_permiso: 50, id_usuario_actor: 100, nuevo_estado: "APROBADO" })
		).rejects.toThrow("El usuario autenticado no es el aprobador asignado de esta solicitud");
	});

	test("rechaza solicitud y notifica solicitante", async () => {
		setupApproveHappy();
		const solicitud = buildSolicitud();
		SolicitudPermisos.findByPk.mockResolvedValue(solicitud);

		const result = await actualizarEstadoSolicitudPermiso({
			id_solicitud_permiso: 50,
			id_usuario_actor: 100,
			nuevo_estado: "RECHAZADO",
		});

		expect(solicitud.update).toHaveBeenCalledWith({ estado_solicitud: 4 }, { transaction });
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(sendEmail).toHaveBeenCalledTimes(1);
		expect(result).toEqual({ id_solicitud: 50, estado_solicitud: "RECHAZADO" });
	});

	test("aprueba solicitud y crea jornadas para días laborables", async () => {
		setupApproveHappy();
		const result = await actualizarEstadoSolicitudPermiso({
			id_solicitud_permiso: 50,
			id_usuario_actor: 100,
			nuevo_estado: "APROBADO",
		});

		expect(JornadaDiaria.create).toHaveBeenCalledTimes(2);
		expect(result).toEqual(
			expect.objectContaining({
				id_solicitud: 50,
				estado_solicitud: "APROBADO",
				fechas_registradas: ["2026-03-10", "2026-03-11"],
			})
		);
	});

	test("falla por solapamiento al aprobar", async () => {
		setupApproveHappy();
		collectConflictDates.mockReturnValueOnce(new Set(["2026-03-11"]));

		await expect(
			actualizarEstadoSolicitudPermiso({ id_solicitud_permiso: 50, id_usuario_actor: 100, nuevo_estado: "APROBADO" })
		).rejects.toThrow("No se puede aprobar la solicitud por solapamiento");
	});

	test("rollback condicionado por tx.finished", async () => {
		setupApproveHappy();
		transaction.finished = false;
		Usuario.findByPk.mockRejectedValue(new Error("boom"));
		await expect(
			actualizarEstadoSolicitudPermiso({ id_solicitud_permiso: 50, id_usuario_actor: 100, nuevo_estado: "APROBADO" })
		).rejects.toThrow("boom");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);

		reset();
		setupApproveHappy();
		transaction.finished = true;
		Usuario.findByPk.mockRejectedValue(new Error("boom2"));
		await expect(
			actualizarEstadoSolicitudPermiso({ id_solicitud_permiso: 50, id_usuario_actor: 100, nuevo_estado: "APROBADO" })
		).rejects.toThrow("boom2");
		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
