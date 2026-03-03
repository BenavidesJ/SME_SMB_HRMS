import { jest } from "@jest/globals";
import { createHorasExtraModelMocks, horasExtraFixtures } from "../../../test-utils/horasExtraModelMocks.js";

const {
	sequelize,
	transaction,
	SolicitudHoraExtra,
	TipoHoraExtra,
	Contrato,
	TipoJornada,
	Estado,
	Usuario,
	Rol,
	Colaborador,
	reset,
} = createHorasExtraModelMocks();

const sendEmail = jest.fn();
const plantillaSolicitudHorasExtra = jest.fn();

jest.unstable_mockModule("../../../models/index.js", () => ({
	sequelize,
	SolicitudHoraExtra,
	TipoHoraExtra,
	Contrato,
	TipoJornada,
	Estado,
	Usuario,
	Rol,
	Colaborador,
}));

jest.unstable_mockModule("../../../services/mail.js", () => ({
	sendEmail,
}));

jest.unstable_mockModule("../../../common/plantillasEmail/emailTemplate.js", () => ({
	plantillaSolicitudHorasExtra,
}));

const { crearSolicitudHoraExtra } = await import("../handlers/solicitudes/crearSolicitudHoraExtra.js");

const payloadBase = {
	id_colaborador: "11",
	fecha_trabajo: "2026-03-12",
	horas_solicitadas: "2",
	id_tipo_hx: "7",
	justificacion: "Cierre mensual",
};

const mockHappyPath = () => {
	TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
	Estado.findOne
		.mockResolvedValueOnce(horasExtraFixtures.estadoActivo)
		.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente);
	Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
	TipoJornada.findByPk.mockResolvedValue(horasExtraFixtures.tipoJornada);
	SolicitudHoraExtra.findOne.mockResolvedValue(null);
	SolicitudHoraExtra.create.mockResolvedValue({
		id_solicitud_hx: 77,
		id_colaborador: 11,
		fecha_solicitud: new Date("2026-03-02T12:00:00Z"),
		fecha_trabajo: "2026-03-12",
		horas_solicitadas: 2,
		justificacion: "Cierre mensual",
	});
	Colaborador.findByPk.mockResolvedValue({
		id_colaborador: 11,
		identificacion: 123,
		nombre: "Ana",
		primer_apellido: "Pérez",
		segundo_apellido: "López",
	});
	Usuario.findAll.mockResolvedValue([]);
	plantillaSolicitudHorasExtra.mockReturnValue("html-template");
	sendEmail.mockResolvedValue(undefined);
};

describe("crearSolicitudHoraExtra", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("valida id_colaborador numérico", async () => {
		await expect(crearSolicitudHoraExtra({ ...payloadBase, id_colaborador: "abc" })).rejects.toThrow(
			"id_colaborador debe ser numérico"
		);
		expect(sequelize.transaction).toHaveBeenCalledTimes(1);
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});

	test("valida fecha_trabajo obligatoria y formato", async () => {
		await expect(crearSolicitudHoraExtra({ ...payloadBase, fecha_trabajo: "" })).rejects.toThrow(
			"fecha_trabajo es obligatoria (YYYY-MM-DD)"
		);
		await expect(crearSolicitudHoraExtra({ ...payloadBase, fecha_trabajo: "fecha-invalida" })).rejects.toThrow(
			"fecha_trabajo debe tener formato YYYY-MM-DD"
		);
	});

	test("valida horas, id_tipo_hx y justificación", async () => {
		await expect(crearSolicitudHoraExtra({ ...payloadBase, horas_solicitadas: "0" })).rejects.toThrow(
			"horas_solicitadas debe ser un número mayor a 0"
		);
		await expect(crearSolicitudHoraExtra({ ...payloadBase, id_tipo_hx: "x" })).rejects.toThrow(
			"id_tipo_hx debe ser numérico"
		);
		await expect(crearSolicitudHoraExtra({ ...payloadBase, justificacion: "" })).rejects.toThrow(
			"justificacion es obligatoria"
		);
		await expect(
			crearSolicitudHoraExtra({ ...payloadBase, justificacion: "a".repeat(101) })
		).rejects.toThrow("justificacion no puede exceder 100 caracteres");
	});

	test("falla cuando no existe el tipo de hora extra", async () => {
		TipoHoraExtra.findByPk.mockResolvedValue(null);

		await expect(crearSolicitudHoraExtra(payloadBase)).rejects.toThrow("No existe tipo de hora extra con id 7");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
		expect(transaction.commit).not.toHaveBeenCalled();
	});

	test("falla si no existe estado ACTIVO", async () => {
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne.mockResolvedValue(null);

		await expect(crearSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			'No existe el estado "ACTIVO" en el catálogo estado'
		);
	});

	test("falla si colaborador no tiene contrato ACTIVO", async () => {
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne.mockResolvedValue(horasExtraFixtures.estadoActivo);
		Contrato.findOne.mockResolvedValue(null);

		await expect(crearSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			"El colaborador no tiene un contrato ACTIVO"
		);
	});

	test("falla si tipo de jornada no existe o es inválido", async () => {
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne.mockResolvedValue(horasExtraFixtures.estadoActivo);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValueOnce(null);

		await expect(crearSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			"El contrato activo no tiene un tipo de jornada válido"
		);

		reset();
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne.mockResolvedValue(horasExtraFixtures.estadoActivo);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue({ ...horasExtraFixtures.tipoJornada, max_horas_diarias: 0 });

		await expect(crearSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			"El tipo de jornada tiene max_horas_diarias inválido"
		);
	});

	test("falla por límite de horas total diario", async () => {
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne.mockResolvedValue(horasExtraFixtures.estadoActivo);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue({ ...horasExtraFixtures.tipoJornada, max_horas_diarias: 11 });

		await expect(crearSolicitudHoraExtra({ ...payloadBase, horas_solicitadas: 2 })).rejects.toThrow(
			"La solicitud excede el máximo diario permitido"
		);
	});

	test("falla cuando no existe estado PENDIENTE", async () => {
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo)
			.mockResolvedValueOnce(null);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue(horasExtraFixtures.tipoJornada);

		await expect(crearSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			'No existe el estado "PENDIENTE" en el catálogo estado'
		);
	});

	test("falla cuando existe solicitud duplicada", async () => {
		mockHappyPath();
		SolicitudHoraExtra.findOne.mockResolvedValue({ id_solicitud_hx: 88 });

		await expect(crearSolicitudHoraExtra(payloadBase)).rejects.toThrow("Ya existe una solicitud para este dia");
		expect(SolicitudHoraExtra.create).not.toHaveBeenCalled();
	});

	test("crea solicitud, hace commit y retorna payload", async () => {
		mockHappyPath();

		const result = await crearSolicitudHoraExtra(payloadBase);

		expect(SolicitudHoraExtra.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id_colaborador: 11,
				fecha_trabajo: "2026-03-12",
				horas_solicitadas: 2,
				id_tipo_hx: 7,
				estado: horasExtraFixtures.estadoPendiente.id_estado,
				justificacion: "Cierre mensual",
			}),
			{ transaction }
		);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(result).toEqual(
			expect.objectContaining({
				id_solicitud_hx: 77,
				horas_solicitadas: "2",
				tipo_hx: { id: 7, nombre: "DOBLE", multiplicador: "2" },
				estado: { id: 2, estado: "PENDIENTE" },
				notificaciones: { admins_notificados: 0 },
			})
		);
	});

	test("envía correo a admins y contabiliza notificaciones", async () => {
		mockHappyPath();
		Usuario.findAll.mockResolvedValue([
			{ colaborador: { correo_electronico: "admin1@empresa.com" } },
			{ colaborador: { correo_electronico: "admin2@empresa.com" } },
			{ colaborador: { correo_electronico: null } },
		]);

		const result = await crearSolicitudHoraExtra(payloadBase);

		expect(plantillaSolicitudHorasExtra).toHaveBeenCalledWith({
			solicitanteNombre: "Ana Pérez López",
			fechaTrabajo: "2026-03-12",
			horasSolicitadas: "2",
		});
		expect(sendEmail).toHaveBeenCalledTimes(2);
		expect(result.notificaciones.admins_notificados).toBe(2);
	});

	test("si falla correo no rompe el flujo", async () => {
		mockHappyPath();
		Usuario.findAll.mockResolvedValue([{ colaborador: { correo_electronico: "admin@empresa.com" } }]);
		sendEmail.mockRejectedValue(new Error("smtp down"));

		const result = await crearSolicitudHoraExtra(payloadBase);

		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(result.notificaciones.admins_notificados).toBe(0);
	});

	test("hace rollback en error y no hace rollback si tx ya finalizó", async () => {
		transaction.finished = false;
		TipoHoraExtra.findByPk.mockRejectedValue(new Error("boom"));
		await expect(crearSolicitudHoraExtra(payloadBase)).rejects.toThrow("boom");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);

		reset();
		transaction.finished = true;
		TipoHoraExtra.findByPk.mockRejectedValue(new Error("boom2"));
		await expect(crearSolicitudHoraExtra(payloadBase)).rejects.toThrow("boom2");
		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
