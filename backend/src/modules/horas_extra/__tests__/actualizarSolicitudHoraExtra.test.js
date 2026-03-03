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
	Colaborador,
	reset,
} = createHorasExtraModelMocks();

const sendEmail = jest.fn();
const plantillaNotificacionSolicitud = jest.fn();

jest.unstable_mockModule("../../../models/index.js", () => ({
	sequelize,
	SolicitudHoraExtra,
	TipoHoraExtra,
	Contrato,
	TipoJornada,
	Estado,
	Colaborador,
}));

jest.unstable_mockModule("../../../services/mail.js", () => ({
	sendEmail,
}));

jest.unstable_mockModule("../../../common/plantillasEmail/emailTemplate.js", () => ({
	plantillaNotificacionSolicitud,
}));

const { actualizarSolicitudHoraExtra } = await import("../handlers/solicitudes/actualizarSolicitudHoraExtra.js");

const createCurrent = (overrides = {}) => {
	const current = {
		...horasExtraFixtures.solicitud,
		...overrides,
	};
	current.update = jest.fn(async (patch) => {
		Object.assign(current, patch);
	});
	return current;
};

const payloadBase = {
	id_solicitud_hx: "99",
	fecha_trabajo: "2026-03-10",
	horas_solicitadas: 2,
	id_tipo_hx: 7,
	justificacion: "Cierre mensual",
	estado: "PENDIENTE",
};

const mockHappyPath = ({ estadoActual = "PENDIENTE", estadoDestino = "PENDIENTE", correo = "colab@empresa.com" } = {}) => {
	const current = createCurrent({ estado: estadoActual === "PENDIENTE" ? 2 : 3 });
	SolicitudHoraExtra.findByPk.mockResolvedValue(current);
	TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
	Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
	TipoJornada.findByPk.mockResolvedValue(horasExtraFixtures.tipoJornada);
	SolicitudHoraExtra.findOne.mockResolvedValue(null);
	Colaborador.findByPk.mockResolvedValue({ ...horasExtraFixtures.colaborador, correo_electronico: correo });
	plantillaNotificacionSolicitud.mockReturnValue("template");
	sendEmail.mockResolvedValue(undefined);

	Estado.findByPk
		.mockResolvedValueOnce({ id_estado: current.estado, estado: estadoActual })
		.mockResolvedValueOnce({ id_estado: estadoDestino === "PENDIENTE" ? 2 : estadoDestino === "APROBADO" ? 3 : 4, estado: estadoDestino });

	if (payloadBase.estado !== undefined) {
		Estado.findOne
			.mockResolvedValueOnce({ id_estado: estadoDestino === "PENDIENTE" ? 2 : estadoDestino === "APROBADO" ? 3 : 4, estado: estadoDestino })
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo)
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente);
	} else {
		Estado.findOne
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo)
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente);
	}

	return current;
};

describe("actualizarSolicitudHoraExtra", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("valida id numérico y existencia de solicitud", async () => {
		await expect(actualizarSolicitudHoraExtra({ ...payloadBase, id_solicitud_hx: "abc" })).rejects.toThrow(
			"id_solicitud_hx debe ser numérico"
		);

		SolicitudHoraExtra.findByPk.mockResolvedValue(null);
		await expect(actualizarSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			"No existe solicitud de horas extra con id 99"
		);
	});

	test("bloquea cambios cuando estado actual no es PENDIENTE", async () => {
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent({ estado: 3 }));
		Estado.findByPk.mockResolvedValue({ id_estado: 3, estado: "APROBADO" });

		await expect(actualizarSolicitudHoraExtra({ ...payloadBase, estado: "RECHAZADO" })).rejects.toThrow(
			"La solicitud no se puede modificar porque su estado actual es APROBADO"
		);
	});

	test("valida envío de al menos un campo y validaciones de campos", async () => {
		const current = createCurrent();
		SolicitudHoraExtra.findByPk.mockResolvedValue(current);
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });

		await expect(actualizarSolicitudHoraExtra({ id_solicitud_hx: 99 })).rejects.toThrow(
			"Debe enviar al menos un campo para actualizar"
		);
		await expect(actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, fecha_trabajo: "" })).rejects.toThrow(
			"fecha_trabajo no puede ser vacía"
		);
		await expect(actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, fecha_trabajo: "fecha-invalida" })).rejects.toThrow(
			"fecha_trabajo debe tener formato YYYY-MM-DD"
		);
		await expect(actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, horas_solicitadas: 0 })).rejects.toThrow(
			"horas_solicitadas debe ser un número mayor a 0"
		);
		await expect(actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, id_tipo_hx: "x" })).rejects.toThrow(
			"id_tipo_hx debe ser numérico"
		);
		await expect(actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, justificacion: "" })).rejects.toThrow(
			"justificacion es obligatoria"
		);
		await expect(
			actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, justificacion: "a".repeat(101) })
		).rejects.toThrow("justificacion no puede exceder 100 caracteres");
	});

	test("valida existencia del tipo de hora extra", async () => {
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent());
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });
		TipoHoraExtra.findByPk.mockResolvedValue(null);

		await expect(actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, id_tipo_hx: 999 })).rejects.toThrow(
			"No existe tipo de hora extra con id 999"
		);
	});

	test("valida estado permitido y existente", async () => {
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent());
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);

		await expect(actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, estado: "foo" })).rejects.toThrow(
			"Estado inválido. Use uno de: PENDIENTE, APROBADO, RECHAZADO, CANCELADO"
		);

		Estado.findOne.mockResolvedValue(null);
		await expect(actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, estado: "APROBADO" })).rejects.toThrow(
			'No existe el estado "APROBADO" en el catálogo estado'
		);
	});

	test("falla si no existe ACTIVO o contrato o jornada válida", async () => {
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent());
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente)
			.mockResolvedValueOnce(null);

		await expect(actualizarSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			'No existe el estado "ACTIVO" en el catálogo estado'
		);

		reset();
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent());
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente)
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo);
		Contrato.findOne.mockResolvedValue(null);

		await expect(actualizarSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			"El colaborador no tiene un contrato ACTIVO"
		);

		reset();
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent());
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente)
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue(null);

		await expect(actualizarSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			"El contrato activo no tiene un tipo de jornada válido"
		);
	});

	test("falla cuando max_horas_diarias es inválido", async () => {
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent());
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente)
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue({ ...horasExtraFixtures.tipoJornada, max_horas_diarias: 0 });

		await expect(actualizarSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			"El tipo de jornada tiene max_horas_diarias inválido"
		);
	});

	test("falla por límite diario de horas", async () => {
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent());
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente)
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue({ ...horasExtraFixtures.tipoJornada, max_horas_diarias: 11 });

		await expect(actualizarSolicitudHoraExtra({ ...payloadBase, horas_solicitadas: 2 })).rejects.toThrow(
			"La solicitud excede el máximo diario permitido"
		);
	});

	test("falla cuando no existe PENDIENTE o hay solicitud duplicada pendiente", async () => {
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent());
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente)
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo)
			.mockResolvedValueOnce(null);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue(horasExtraFixtures.tipoJornada);

		await expect(actualizarSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			'No existe el estado "PENDIENTE" en el catálogo estado'
		);

		reset();
		SolicitudHoraExtra.findByPk.mockResolvedValue(createCurrent());
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "PENDIENTE" });
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findOne
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente)
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo)
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue(horasExtraFixtures.tipoJornada);
		SolicitudHoraExtra.findOne.mockResolvedValue({ id_solicitud_hx: 100 });

		await expect(actualizarSolicitudHoraExtra(payloadBase)).rejects.toThrow(
			"Ya existe una solicitud de horas extra PENDIENTE para este día"
		);
	});

	test("actualiza solicitud y retorna payload sin notificar si no cambia estado final", async () => {
		const current = mockHappyPath({ estadoActual: "PENDIENTE", estadoDestino: "PENDIENTE" });

		const result = await actualizarSolicitudHoraExtra(payloadBase);

		expect(current.update).toHaveBeenCalledWith(
			expect.objectContaining({ fecha_trabajo: "2026-03-10", horas_solicitadas: 2, id_tipo_hx: 7 }),
			{ transaction }
		);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(result.notificaciones.colaborador_notificado).toBe(false);
		expect(sendEmail).not.toHaveBeenCalled();
	});

	test("si no envía id_tipo_hx usa el tipo actual de la solicitud", async () => {
		const current = createCurrent({ estado: 2, id_tipo_hx: 77 });
		SolicitudHoraExtra.findByPk.mockResolvedValue(current);
		TipoHoraExtra.findByPk.mockResolvedValue({ id_tipo_hx: 77, nombre: "NOCTURNA", multiplicador: 1.5 });
		Estado.findByPk
			.mockResolvedValueOnce({ id_estado: 2, estado: "PENDIENTE" })
			.mockResolvedValueOnce({ id_estado: 2, estado: "PENDIENTE" });
		Estado.findOne
			.mockResolvedValueOnce({ id_estado: 2, estado: "PENDIENTE" })
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo)
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue(horasExtraFixtures.tipoJornada);
		SolicitudHoraExtra.findOne.mockResolvedValue(null);
		Colaborador.findByPk.mockResolvedValue(horasExtraFixtures.colaborador);

		const result = await actualizarSolicitudHoraExtra({
			id_solicitud_hx: 99,
			horas_solicitadas: 2,
			justificacion: "Actualizada",
			estado: "PENDIENTE",
		});

		expect(TipoHoraExtra.findByPk).toHaveBeenCalledWith(77, expect.any(Object));
		expect(result.tipo_hx.nombre).toBe("NOCTURNA");
	});

	test("notifica colaborador cuando cambia a APROBADO y tolera error de correo", async () => {
		const current = createCurrent({ estado: 2 });
		SolicitudHoraExtra.findByPk.mockResolvedValue(current);
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findByPk
			.mockResolvedValueOnce({ id_estado: 2, estado: "PENDIENTE" })
			.mockResolvedValueOnce({ id_estado: 3, estado: "APROBADO" });
		Estado.findOne
			.mockResolvedValueOnce({ id_estado: 3, estado: "APROBADO" })
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo)
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue(horasExtraFixtures.tipoJornada);
		SolicitudHoraExtra.findOne.mockResolvedValue(null);
		Colaborador.findByPk.mockResolvedValue(horasExtraFixtures.colaborador);
		plantillaNotificacionSolicitud.mockReturnValue("template-ok");
		sendEmail.mockRejectedValue(new Error("smtp down"));

		const result = await actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, estado: "APROBADO" });

		expect(plantillaNotificacionSolicitud).toHaveBeenCalledWith(
			expect.objectContaining({
				titulo: "Solicitud de horas extra aprobada",
				variante: "success",
			})
		);
		expect(sendEmail).toHaveBeenCalledTimes(1);
		expect(result.notificaciones.colaborador_notificado).toBe(true);
	});

	test("no notifica si colaborador no tiene correo", async () => {
		const current = createCurrent({ estado: 2 });
		SolicitudHoraExtra.findByPk.mockResolvedValue(current);
		TipoHoraExtra.findByPk.mockResolvedValue(horasExtraFixtures.tipoHoraExtra);
		Estado.findByPk
			.mockResolvedValueOnce({ id_estado: 2, estado: "PENDIENTE" })
			.mockResolvedValueOnce({ id_estado: 4, estado: "RECHAZADO" });
		Estado.findOne
			.mockResolvedValueOnce({ id_estado: 4, estado: "RECHAZADO" })
			.mockResolvedValueOnce(horasExtraFixtures.estadoActivo)
			.mockResolvedValueOnce(horasExtraFixtures.estadoPendiente);
		Contrato.findOne.mockResolvedValue(horasExtraFixtures.contratoActivo);
		TipoJornada.findByPk.mockResolvedValue(horasExtraFixtures.tipoJornada);
		SolicitudHoraExtra.findOne.mockResolvedValue(null);
		Colaborador.findByPk.mockResolvedValue({ ...horasExtraFixtures.colaborador, correo_electronico: null });

		const result = await actualizarSolicitudHoraExtra({ id_solicitud_hx: 99, estado: "RECHAZADO" });

		expect(sendEmail).not.toHaveBeenCalled();
		expect(result.notificaciones.colaborador_notificado).toBe(false);
	});

	test("hace rollback si hay error y tx no finalizada", async () => {
		transaction.finished = false;
		SolicitudHoraExtra.findByPk.mockRejectedValue(new Error("boom"));

		await expect(actualizarSolicitudHoraExtra(payloadBase)).rejects.toThrow("boom");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});

	test("no hace rollback si tx ya finalizó", async () => {
		transaction.finished = true;
		SolicitudHoraExtra.findByPk.mockRejectedValue(new Error("boom2"));

		await expect(actualizarSolicitudHoraExtra(payloadBase)).rejects.toThrow("boom2");
		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
