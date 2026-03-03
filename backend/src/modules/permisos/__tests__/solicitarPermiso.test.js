import { jest } from "@jest/globals";
import dayjs from "dayjs";
import { createPermisosVacacionesModelMocks } from "../../../test-utils/permisosVacacionesModelMocks.js";

const {
	sequelize,
	transaction,
	Colaborador,
	Contrato,
	HorarioLaboral,
	JornadaDiaria,
	SolicitudPermisos,
	SolicitudVacaciones,
	reset,
} = createPermisosVacacionesModelMocks();

const sendEmail = jest.fn();
const plantillaSolicitudPermisos = jest.fn();

const assertId = jest.fn();
const assertDate = jest.fn();
const listDatesInclusive = jest.fn();
const fetchEstadoId = jest.fn();
const collectConflictDates = jest.fn();
const splitDatesBySchedule = jest.fn();
const normalizeDayChars = jest.fn();

jest.unstable_mockModule("../../../models/index.js", () => ({
	sequelize,
	Colaborador,
	Contrato,
	HorarioLaboral,
	JornadaDiaria,
	SolicitudPermisos,
	SolicitudVacaciones,
}));

jest.unstable_mockModule("../../../services/mail.js", () => ({ sendEmail }));

jest.unstable_mockModule("../../../common/plantillasEmail/emailTemplate.js", () => ({
	plantillaSolicitudPermisos,
}));

jest.unstable_mockModule("../../vacaciones/handlers/utils/vacacionesUtils.js", () => ({
	assertId,
	assertDate,
	listDatesInclusive,
	fetchEstadoId,
	collectConflictDates,
	splitDatesBySchedule,
	normalizeDayChars,
}));

const { solicitarPermiso } = await import("../handlers/solicitarPermiso.js");

const basePayload = {
	id_colaborador: 10,
	id_aprobador: 3,
	tipo_permiso: "GOCE",
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
	normalizeDayChars.mockImplementation((value) => new Set(String(value ?? "").split("")));
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
	Contrato.findOne.mockResolvedValue({ id_contrato: 7, id_jefe_directo: 3, horas_semanales: 40 });
	HorarioLaboral.findOne.mockResolvedValue({ dias_laborales: "LKMJV", dias_libres: "SD" });
	JornadaDiaria.findAll.mockResolvedValue([]);
	SolicitudVacaciones.findAll.mockResolvedValue([]);
	SolicitudPermisos.findAll.mockResolvedValue([]);
	SolicitudPermisos.create.mockResolvedValue({ id_solicitud: 99 });
	plantillaSolicitudPermisos.mockReturnValue("html");
	sendEmail.mockResolvedValue(undefined);
};

describe("solicitarPermiso", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("valida tipo_permiso requerido y permitido", async () => {
		assertId.mockImplementation((value) => Number(value));
		await expect(solicitarPermiso({ ...basePayload, tipo_permiso: "" })).rejects.toThrow("tipo_permiso es requerido");
		await expect(solicitarPermiso({ ...basePayload, tipo_permiso: "otro" })).rejects.toThrow("tipo_permiso inválido");
		expect(sequelize.transaction).not.toHaveBeenCalled();
	});

	test("valida fecha_fin mayor o igual a fecha_inicio", async () => {
		assertId.mockImplementation((value) => Number(value));
		assertDate.mockImplementation((value) => dayjs(String(value), "YYYY-MM-DD", true));

		await expect(
			solicitarPermiso({ ...basePayload, fecha_inicio: "2026-03-12", fecha_fin: "2026-03-10" })
		).rejects.toThrow("fecha_fin no puede ser menor que fecha_inicio");
	});

	test("falla cuando colaborador no existe", async () => {
		setupHappyPath();
		Colaborador.findByPk.mockImplementation(async () => null);

		await expect(solicitarPermiso(basePayload)).rejects.toThrow("No existe colaborador con id 10");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});

	test("falla cuando no hay días laborables", async () => {
		setupHappyPath();
		splitDatesBySchedule.mockReturnValue({ workingDates: [], restDates: ["2026-03-10"] });

		await expect(solicitarPermiso(basePayload)).rejects.toThrow("Este dia que solicitaste es de descanso");
	});

	test("falla por incapacidad en fechas solicitadas", async () => {
		setupHappyPath();
		JornadaDiaria.findAll.mockResolvedValue([{ fecha: "2026-03-10" }]);

		await expect(solicitarPermiso(basePayload)).rejects.toThrow("El día 2026-03-10 ya tiene una incapacidad registrada");
	});

	test("falla por conflictos con vacaciones y permisos", async () => {
		setupHappyPath();
		SolicitudVacaciones.findAll.mockResolvedValue([{ fecha_inicio: "2026-03-11", fecha_fin: "2026-03-11" }]);
		collectConflictDates.mockReturnValueOnce(new Set(["2026-03-11"]));

		await expect(solicitarPermiso(basePayload)).rejects.toThrow("El día 2026-03-11 ya está reservado por vacaciones");

		reset();
		setupHappyPath();
		SolicitudPermisos.findAll.mockResolvedValue([{ fecha_inicio: "2026-03-12", fecha_fin: "2026-03-12" }]);
		collectConflictDates.mockImplementation(({ solicitudes }) => {
			if (solicitudes?.length) {
				const first = solicitudes[0];
				if (first.fecha_inicio === "2026-03-12") {
					return new Set(["2026-03-12"]);
				}
			}
			return new Set();
		});
		await expect(solicitarPermiso(basePayload)).rejects.toThrow("El día 2026-03-12 ya tiene un permiso en trámite");
	});

	test("falla cuando aprobador no coincide con jefe directo", async () => {
		setupHappyPath();
		Contrato.findOne.mockResolvedValue({ id_contrato: 7, id_jefe_directo: 5, horas_semanales: 40 });

		await expect(solicitarPermiso(basePayload)).rejects.toThrow("El aprobador debe ser el jefe directo del colaborador");
	});

	test("falla cuando aprobador no existe", async () => {
		setupHappyPath();
		Colaborador.findByPk.mockImplementation(async (id) => {
			if (Number(id) === 10) {
				return { id_colaborador: 10, nombre: "Ana", primer_apellido: "Pérez", segundo_apellido: "López" };
			}
			return null;
		});

		await expect(solicitarPermiso(basePayload)).rejects.toThrow("No existe colaborador aprobador con id 3");
	});

	test("crea solicitud y retorna payload con warning por días de descanso", async () => {
		setupHappyPath();
		splitDatesBySchedule.mockReturnValue({
			workingDates: ["2026-03-10", "2026-03-11"],
			restDates: ["2026-03-12"],
		});

		const result = await solicitarPermiso(basePayload);

		expect(SolicitudPermisos.create).toHaveBeenCalledWith(
			expect.objectContaining({
				id_colaborador: 10,
				id_aprobador: 3,
				estado_solicitud: 2,
				con_goce_salarial: true,
				cantidad_dias: 2,
			}),
			{ transaction }
		);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(sendEmail).toHaveBeenCalledTimes(1);
		expect(result).toEqual(
			expect.objectContaining({
				id_solicitud: 99,
				estado_solicitud: "PENDIENTE",
				tipo_permiso: "GOCE",
				warnings: expect.arrayContaining([expect.stringContaining("no se registrarán")]),
			})
		);
	});

	test("tolera error enviando correo", async () => {
		setupHappyPath();
		sendEmail.mockRejectedValue(new Error("smtp down"));

		const result = await solicitarPermiso({ ...basePayload, tipo_permiso: "SIN_GOCE" });

		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(result.tipo_permiso).toBe("SIN_GOCE");
		expect(result.con_goce_salarial).toBe(false);
	});

	test("rollback condicionado por tx.finished", async () => {
		setupHappyPath();
		transaction.finished = false;
		Colaborador.findByPk.mockRejectedValue(new Error("boom"));

		await expect(solicitarPermiso(basePayload)).rejects.toThrow("boom");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);

		reset();
		setupHappyPath();
		transaction.finished = true;
		Colaborador.findByPk.mockRejectedValue(new Error("boom2"));

		await expect(solicitarPermiso(basePayload)).rejects.toThrow("boom2");
		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
