import { jest } from "@jest/globals";
import dayjs from "dayjs";
import { createPermisosVacacionesModelMocks } from "../../../test-utils/permisosVacacionesModelMocks.js";

const {
	sequelize,
	transaction,
	Colaborador,
	Contrato,
	HorarioLaboral,
	SolicitudVacaciones,
	SolicitudPermisos,
	JornadaDiaria,
	SaldoVacaciones,
	Feriado,
	reset,
} = createPermisosVacacionesModelMocks();

const sendEmail = jest.fn();
const plantillaSolicitudVacaciones = jest.fn();

const assertId = jest.fn();
const assertDate = jest.fn();
const listDatesInclusive = jest.fn();
const fetchEstadoId = jest.fn();
const collectConflictDates = jest.fn();
const splitDatesBySchedule = jest.fn();

jest.unstable_mockModule("../../../models/index.js", () => ({
	sequelize,
	Colaborador,
	Contrato,
	HorarioLaboral,
	SolicitudVacaciones,
	SolicitudPermisos,
	JornadaDiaria,
	SaldoVacaciones,
	Feriado,
}));

jest.unstable_mockModule("../../../services/mail.js", () => ({ sendEmail }));

jest.unstable_mockModule("../../../common/plantillasEmail/emailTemplate.js", () => ({
	plantillaSolicitudVacaciones,
}));

jest.unstable_mockModule("../handlers/utils/vacacionesUtils.js", () => ({
	assertId,
	assertDate,
	listDatesInclusive,
	fetchEstadoId,
	collectConflictDates,
	splitDatesBySchedule,
}));

const { solicitarVacaciones } = await import("../handlers/solicitarVacaciones.js");

const basePayload = {
	id_colaborador: 10,
	id_aprobador: 3,
	fecha_inicio: "2026-03-10",
	fecha_fin: "2026-03-12",
};

const setupHappyPath = () => {
	assertId.mockImplementation((value) => Number(value));
	assertDate.mockImplementation((value) => dayjs(String(value), "YYYY-MM-DD", true));
	listDatesInclusive.mockReturnValue(["2026-03-10", "2026-03-11", "2026-03-12"]);
	fetchEstadoId
		.mockResolvedValueOnce(1)
		.mockResolvedValueOnce(2)
		.mockResolvedValueOnce(3);
	collectConflictDates.mockReturnValue(new Set());
	splitDatesBySchedule.mockReturnValue({
		workingDates: ["2026-03-10", "2026-03-11", "2026-03-12"],
		restDates: [],
	});

	Colaborador.findByPk.mockImplementation(async (id) => {
		if (Number(id) === 10) {
			return { id_colaborador: 10, nombre: "Ana", primer_apellido: "Pérez", segundo_apellido: "López" };
		}
		if (Number(id) === 3) {
			return { id_colaborador: 3, correo_electronico: "jefe@empresa.com" };
		}
		return null;
	});
	Contrato.findOne.mockResolvedValue({ id_contrato: 7, id_jefe_directo: 3 });
	HorarioLaboral.findOne.mockResolvedValue({ id_horario: 8, dias_laborales: "LKMJV", dias_libres: "SD" });
	SaldoVacaciones.findOne.mockResolvedValue({ id_saldo_vac: 5, dias_ganados: 20, dias_tomados: 4 });
	SolicitudVacaciones.findAll.mockResolvedValue([]);
	SolicitudPermisos.findAll.mockResolvedValue([]);
	JornadaDiaria.findAll.mockResolvedValue([]);
	Feriado.findAll.mockResolvedValue([]);
	SolicitudVacaciones.create.mockResolvedValue({ id_solicitud_vacaciones: 99 });
	sendEmail.mockResolvedValue(undefined);
	plantillaSolicitudVacaciones.mockReturnValue("html");
};

describe("solicitarVacaciones", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("valida fecha_fin no menor a fecha_inicio", async () => {
		assertId.mockImplementation((value) => Number(value));
		assertDate.mockImplementation((value) => dayjs(String(value), "YYYY-MM-DD", true));

		await expect(
			solicitarVacaciones({ ...basePayload, fecha_inicio: "2026-03-12", fecha_fin: "2026-03-10" })
		).rejects.toThrow("fecha_fin no puede ser menor que fecha_inicio");
	});

	test("falla cuando colaborador no existe", async () => {
		setupHappyPath();
		Colaborador.findByPk.mockImplementation(async () => null);

		await expect(solicitarVacaciones(basePayload)).rejects.toThrow("No existe colaborador con id 10");
	});

	test("falla si aprobador no coincide con jefe directo", async () => {
		setupHappyPath();
		Contrato.findOne.mockResolvedValue({ id_contrato: 7, id_jefe_directo: 9 });

		await expect(solicitarVacaciones(basePayload)).rejects.toThrow("El aprobador debe ser el jefe directo del colaborador");
	});

	test("falla si no existe saldo vacaciones", async () => {
		setupHappyPath();
		SaldoVacaciones.findOne.mockResolvedValue(null);

		await expect(solicitarVacaciones(basePayload)).rejects.toThrow("No se encontró saldo de vacaciones para el colaborador");
	});

	test("falla por solapamiento", async () => {
		setupHappyPath();
		SolicitudPermisos.findAll.mockResolvedValue([{ fecha_inicio: "2026-03-11", fecha_fin: "2026-03-11" }]);
		collectConflictDates.mockImplementation(({ solicitudes }) => (solicitudes?.length ? new Set(["2026-03-11"]) : new Set()));

		await expect(solicitarVacaciones(basePayload)).rejects.toThrow("No se puede crear la solicitud por solapamiento");
	});

	test("falla cuando todos los días son descanso", async () => {
		setupHappyPath();
		splitDatesBySchedule.mockReturnValue({ workingDates: [], restDates: ["2026-03-10", "2026-03-11", "2026-03-12"] });

		await expect(solicitarVacaciones(basePayload)).rejects.toThrow("Este dia que solicitaste es de descanso");
	});

	test("falla por saldo insuficiente", async () => {
		setupHappyPath();
		SaldoVacaciones.findOne.mockResolvedValue({ id_saldo_vac: 5, dias_ganados: 6, dias_tomados: 4 });

		await expect(solicitarVacaciones(basePayload)).rejects.toThrow("La solicitud requiere 3 días cobrables y solo hay 2 disponibles");
	});

	test("crea solicitud y retorna meta_engine", async () => {
		setupHappyPath();
		Feriado.findAll.mockResolvedValue([{ fecha: "2026-03-11", nombre: "Feriado Demo" }]);
		splitDatesBySchedule.mockReturnValue({
			workingDates: ["2026-03-10", "2026-03-11"],
			restDates: ["2026-03-12"],
		});

		const result = await solicitarVacaciones(basePayload);

		expect(SolicitudVacaciones.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id_colaborador: 10,
				id_aprobador: 3,
				estado_solicitud: 2,
				id_saldo_vacaciones: 5,
			}),
			{ transaction }
		);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(result).toEqual(
			expect.objectContaining({
				id_solicitud_vacaciones: 99,
				estado_solicitud: "PENDIENTE",
				dias_solicitados: "3",
				meta_engine: expect.objectContaining({
					chargeableDays: 1,
					chargeableDates: ["2026-03-10"],
				}),
			})
		);
		expect(sendEmail).toHaveBeenCalledTimes(1);
	});

	test("tolera error enviando correo", async () => {
		setupHappyPath();
		sendEmail.mockRejectedValue(new Error("smtp down"));

		const result = await solicitarVacaciones(basePayload);
		expect(result.id_solicitud_vacaciones).toBe(99);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("rollback condicionado por tx.finished", async () => {
		setupHappyPath();
		transaction.finished = false;
		Colaborador.findByPk.mockRejectedValue(new Error("boom"));

		await expect(solicitarVacaciones(basePayload)).rejects.toThrow("boom");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);

		reset();
		setupHappyPath();
		transaction.finished = true;
		Colaborador.findByPk.mockRejectedValue(new Error("boom2"));
		await expect(solicitarVacaciones(basePayload)).rejects.toThrow("boom2");
		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
