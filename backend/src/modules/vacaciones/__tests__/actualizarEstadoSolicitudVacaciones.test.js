import { jest } from "@jest/globals";
import dayjs from "dayjs";
import { createPermisosVacacionesModelMocks } from "../../../test-utils/permisosVacacionesModelMocks.js";

const {
	sequelize,
	transaction,
	SolicitudVacaciones,
	SolicitudPermisos,
	JornadaDiaria,
	SaldoVacaciones,
	Contrato,
	HorarioLaboral,
	Usuario,
	Feriado,
	Colaborador,
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
	SolicitudVacaciones,
	SolicitudPermisos,
	JornadaDiaria,
	SaldoVacaciones,
	Contrato,
	HorarioLaboral,
	Usuario,
	Feriado,
	Colaborador,
}));

jest.unstable_mockModule("../../../services/mail.js", () => ({ sendEmail }));

jest.unstable_mockModule("../../../common/plantillasEmail/emailTemplate.js", () => ({
	plantillaNotificacionSolicitud,
}));

jest.unstable_mockModule("../handlers/utils/vacacionesUtils.js", () => ({
	assertId,
	assertDate,
	listDatesInclusive,
	fetchEstadoId,
	collectConflictDates,
	splitDatesBySchedule,
}));

const { actualizarEstadoSolicitudVacaciones } = await import("../handlers/actualizarEstadoSolicitudVacaciones.js");

const buildSolicitud = (overrides = {}) => {
	const row = {
		id_solicitud_vacaciones: 40,
		id_colaborador: 10,
		id_aprobador: 3,
		estado_solicitud: 2,
		fecha_inicio: "2026-03-10",
		fecha_fin: "2026-03-12",
		id_saldo_vacaciones: 5,
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

	Usuario.findByPk.mockResolvedValue({ id_usuario: 90, id_colaborador: 3 });
	SolicitudVacaciones.findByPk.mockResolvedValue(buildSolicitud());
	Colaborador.findByPk.mockResolvedValue({ id_colaborador: 10, nombre: "Ana", correo_electronico: "ana@empresa.com" });
	Contrato.findOne.mockResolvedValue({ id_contrato: 7 });
	HorarioLaboral.findOne.mockResolvedValue({ id_horario: 8 });
	SolicitudVacaciones.findAll.mockResolvedValue([]);
	SolicitudPermisos.findAll.mockResolvedValue([]);
	JornadaDiaria.findAll.mockResolvedValue([]);
	Feriado.findAll.mockResolvedValue([]);
	SaldoVacaciones.findByPk.mockResolvedValue({
		id_saldo_vac: 5,
		dias_ganados: 20,
		dias_tomados: 4,
		update: jest.fn().mockResolvedValue(undefined),
	});
	JornadaDiaria.create.mockResolvedValue({});
	sendEmail.mockResolvedValue(undefined);
	plantillaNotificacionSolicitud.mockReturnValue("html");
};

describe("actualizarEstadoSolicitudVacaciones", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("valida nuevo_estado permitido", async () => {
		assertId.mockImplementation((value) => Number(value));
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 1, id_usuario_actor: 1, nuevo_estado: "OTRO" })
		).rejects.toThrow("nuevo_estado debe ser APROBADO o RECHAZADO");
	});

	test("falla por usuario inexistente, solicitud inexistente, estado no pendiente y actor no aprobador", async () => {
		assertId.mockImplementation((value) => Number(value));
		fetchEstadoId
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(3)
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(1);
		Usuario.findByPk.mockResolvedValue(null);
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("No existe el usuario con id 90");

		reset();
		assertId.mockImplementation((value) => Number(value));
		fetchEstadoId
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(3)
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(1);
		Usuario.findByPk.mockResolvedValue({ id_usuario: 90, id_colaborador: 3 });
		SolicitudVacaciones.findByPk.mockResolvedValue(null);
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("No existe la solicitud de vacaciones 40");

		reset();
		assertId.mockImplementation((value) => Number(value));
		fetchEstadoId
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(3)
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(1);
		Usuario.findByPk.mockResolvedValue({ id_usuario: 90, id_colaborador: 3 });
		SolicitudVacaciones.findByPk.mockResolvedValue(buildSolicitud({ estado_solicitud: 3 }));
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("Solo se pueden cambiar solicitudes en estado PENDIENTE");

		reset();
		assertId.mockImplementation((value) => Number(value));
		fetchEstadoId
			.mockResolvedValueOnce(2)
			.mockResolvedValueOnce(3)
			.mockResolvedValueOnce(4)
			.mockResolvedValueOnce(1);
		Usuario.findByPk.mockResolvedValue({ id_usuario: 90, id_colaborador: 3 });
		SolicitudVacaciones.findByPk.mockResolvedValue(buildSolicitud({ estado_solicitud: 2, id_aprobador: 9 }));
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("El usuario autenticado no es el aprobador asignado de esta solicitud");
	});

	test("rechaza solicitud y notifica solicitante", async () => {
		setupApproveHappy();
		const solicitud = buildSolicitud();
		SolicitudVacaciones.findByPk.mockResolvedValue(solicitud);

		const result = await actualizarEstadoSolicitudVacaciones({
			id_solicitud_vacaciones: 40,
			id_usuario_actor: 90,
			nuevo_estado: "RECHAZADO",
		});

		expect(solicitud.update).toHaveBeenCalledWith({ estado_solicitud: 4 }, { transaction });
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(sendEmail).toHaveBeenCalledTimes(1);
		expect(result.estado_solicitud).toBe("RECHAZADO");
	});

	test("aprueba solicitud, actualiza jornadas y saldo", async () => {
		setupApproveHappy();
		const saldo = {
			id_saldo_vac: 5,
			dias_ganados: 20,
			dias_tomados: 4,
			update: jest.fn().mockResolvedValue(undefined),
		};
		SaldoVacaciones.findByPk.mockResolvedValue(saldo);

		const result = await actualizarEstadoSolicitudVacaciones({
			id_solicitud_vacaciones: 40,
			id_usuario_actor: 90,
			nuevo_estado: "APROBADO",
		});

		expect(JornadaDiaria.create).toHaveBeenCalledTimes(2);
		expect(saldo.update).toHaveBeenCalledWith({ dias_tomados: 6 }, { transaction });
		expect(result).toEqual(
			expect.objectContaining({
				estado_solicitud: "APROBADO",
				dias_cobrables: ["2026-03-10", "2026-03-11"],
			})
		);
	});

	test("falla por solapamiento y por saldo faltante", async () => {
		setupApproveHappy();
		collectConflictDates.mockReturnValue(new Set(["2026-03-11"]));
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("No se puede aprobar la solicitud por solapamiento");

		reset();
		setupApproveHappy();
		SaldoVacaciones.findByPk.mockResolvedValue(null);
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("No se encontró el saldo de vacaciones asociado a la solicitud");
	});

	test("falla por saldo insuficiente y por jornada incompatible", async () => {
		setupApproveHappy();
		SaldoVacaciones.findByPk.mockResolvedValue({
			id_saldo_vac: 5,
			dias_ganados: 5,
			dias_tomados: 4,
			update: jest.fn().mockResolvedValue(undefined),
		});
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("No se puede aprobar la solicitud: requiere 2 días y solo hay 1 disponibles");

		reset();
		setupApproveHappy();
		JornadaDiaria.findAll.mockResolvedValue([{ fecha: "2026-03-10", incapacidad: null, permiso: 11, vacaciones: null, update: jest.fn() }]);
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("No se puede aprobar la solicitud por solapamiento");
	});

	test("rollback condicionado por tx.finished", async () => {
		setupApproveHappy();
		transaction.finished = false;
		Usuario.findByPk.mockRejectedValue(new Error("boom"));
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("boom");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);

		reset();
		setupApproveHappy();
		transaction.finished = true;
		Usuario.findByPk.mockRejectedValue(new Error("boom2"));
		await expect(
			actualizarEstadoSolicitudVacaciones({ id_solicitud_vacaciones: 40, id_usuario_actor: 90, nuevo_estado: "APROBADO" })
		).rejects.toThrow("boom2");
		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
