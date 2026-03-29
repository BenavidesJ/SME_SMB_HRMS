import { jest } from "@jest/globals";
import { createAsistenciaModelMocks, asistenciaFixtures } from "../../../test-utils/asistenciaModelMocks.js";

const {
	sequelize,
	transaction,
	Colaborador,
	TipoMarca,
	MarcaAsistencia,
	JornadaDiaria,
	reset,
} = createAsistenciaModelMocks();

jest.unstable_mockModule("../../../models/index.js", () => ({
	sequelize,
	Colaborador,
	TipoMarca,
	MarcaAsistencia,
	JornadaDiaria,
}));

const { actualizarMarcaAsistencia } = await import("../handlers/actualizarMarca.js");

const setupHappyPath = () => {
	Colaborador.findOne.mockResolvedValue(asistenciaFixtures.colaborador);
	TipoMarca.findAll.mockResolvedValue([asistenciaFixtures.tipoEntrada, asistenciaFixtures.tipoSalida]);

	const marca = {
		id_marca: 10,
		timestamp: new Date("2026-03-01T08:00:00"),
		update: jest.fn(async (payload) => {
			if (Object.prototype.hasOwnProperty.call(payload, "timestamp")) {
				marca.timestamp = payload.timestamp;
			}
		}),
		reload: jest.fn().mockResolvedValue(undefined),
	};

	MarcaAsistencia.findOne.mockResolvedValue(marca);
	MarcaAsistencia.findAll.mockResolvedValue([
		{ tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date("2026-03-01T08:00:00") },
		{ tipoMarca: { nombre: "SALIDA" }, timestamp: new Date("2026-03-01T17:00:00") },
	]);
	JornadaDiaria.findOne.mockResolvedValue(null);
	JornadaDiaria.create.mockResolvedValue({});

	return { marca };
};

describe("actualizarMarcaAsistencia", () => {
	beforeEach(() => {
		reset();
	});

	test("valida identificación obligatoria", async () => {
		await expect(
			actualizarMarcaAsistencia({ tipo_marca: "ENTRADA", timestamp: "2026-03-01T08:00:00", nuevo_timestamp: "2026-03-01T08:05:00" })
		).rejects.toThrow("La identificación es obligatoria");
	});

	test("valida identificación numérica", async () => {
		await expect(
			actualizarMarcaAsistencia({ identificacion: "abc", tipo_marca: "ENTRADA", timestamp: "2026-03-01T08:00:00", nuevo_timestamp: "2026-03-01T08:05:00" })
		).rejects.toThrow("La identificación debe ser numérica");
	});

	test("valida tipo_marca permitido", async () => {
		await expect(
			actualizarMarcaAsistencia({ identificacion: "123", tipo_marca: "PAUSA", timestamp: "2026-03-01T08:00:00", nuevo_timestamp: "2026-03-01T08:05:00" })
		).rejects.toThrow("tipo_marca debe ser ENTRADA o SALIDA");
	});

	test("valida tipo_marca obligatorio", async () => {
		await expect(
			actualizarMarcaAsistencia({ identificacion: "123", tipo_marca: undefined, timestamp: "2026-03-01T08:00:00", nuevo_timestamp: "2026-03-01T08:05:00" })
		).rejects.toThrow("El tipo de marca es obligatorio");
	});

	test("valida timestamp original", async () => {
		await expect(
			actualizarMarcaAsistencia({ identificacion: "123", tipo_marca: "ENTRADA", timestamp: "invalido", nuevo_timestamp: "2026-03-01T08:05:00" })
		).rejects.toThrow("El timestamp original no es válido");
	});

	test("requiere nuevo_timestamp", async () => {
		await expect(
			actualizarMarcaAsistencia({ identificacion: "123", tipo_marca: "ENTRADA", timestamp: "2026-03-01T08:00:00" })
		).rejects.toThrow("Debes proporcionar un nuevo timestamp para actualizar");
	});

	test("valida nuevo_timestamp", async () => {
		await expect(
			actualizarMarcaAsistencia({ identificacion: "123", tipo_marca: "ENTRADA", timestamp: "2026-03-01T08:00:00", nuevo_timestamp: "x" })
		).rejects.toThrow("El nuevo timestamp no es válido");
	});

	test("exige que la corrección sea del mismo día", async () => {
		await expect(
			actualizarMarcaAsistencia({
				identificacion: "123",
				tipo_marca: "ENTRADA",
				timestamp: "2026-03-01T08:00:00",
				nuevo_timestamp: "2026-03-02T08:00:00",
			})
		).rejects.toThrow("La corrección debe mantenerse dentro del mismo día");
	});

	test("lanza error si colaborador no existe", async () => {
		Colaborador.findOne.mockResolvedValue(null);

		await expect(
			actualizarMarcaAsistencia({
				identificacion: "123",
				tipo_marca: "ENTRADA",
				timestamp: "2026-03-01T08:00:00",
				nuevo_timestamp: "2026-03-01T08:05:00",
			})
		).rejects.toThrow("No existe un colaborador con identificación 123");
	});

	test("lanza error si no existe catálogo ENTRADA/SALIDA", async () => {
		Colaborador.findOne.mockResolvedValue(asistenciaFixtures.colaborador);
		TipoMarca.findAll.mockResolvedValue([asistenciaFixtures.tipoEntrada]);

		await expect(
			actualizarMarcaAsistencia({
				identificacion: "123456789",
				tipo_marca: "ENTRADA",
				timestamp: "2026-03-01T08:00:00",
				nuevo_timestamp: "2026-03-01T08:05:00",
			})
		).rejects.toThrow("No existen ENTRADA y/o SALIDA en el catálogo tipo_marca");
	});

	test("lanza error si no existe marca del día con fecha en mensaje", async () => {
		Colaborador.findOne.mockResolvedValue(asistenciaFixtures.colaborador);
		TipoMarca.findAll.mockResolvedValue([asistenciaFixtures.tipoEntrada, asistenciaFixtures.tipoSalida]);
		MarcaAsistencia.findOne.mockResolvedValue(null);

		await expect(
			actualizarMarcaAsistencia({
				identificacion: "123456789",
				tipo_marca: "ENTRADA",
				timestamp: "2026-03-01T08:00:00",
				nuevo_timestamp: "2026-03-01T08:05:00",
			})
		).rejects.toThrow("No existe una marca ENTRADA para la fecha 2026-03-01 que se pueda actualizar");
	});

	test("lanza error si salida es menor o igual que entrada", async () => {
		setupHappyPath();
		MarcaAsistencia.findAll.mockResolvedValue([
			{ tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date("2026-03-01T10:00:00") },
			{ tipoMarca: { nombre: "SALIDA" }, timestamp: new Date("2026-03-01T09:00:00") },
		]);

		await expect(
			actualizarMarcaAsistencia({
				identificacion: "123456789",
				tipo_marca: "ENTRADA",
				timestamp: "2026-03-01T08:00:00",
				nuevo_timestamp: "2026-03-01T08:05:00",
			})
		).rejects.toThrow("La hora de salida debe ser posterior a la hora de entrada");
	});

	test("actualiza marca y crea jornada cuando no existe", async () => {
		const { marca } = setupHappyPath();

		const result = await actualizarMarcaAsistencia({
			identificacion: "123456789",
			tipo_marca: "ENTRADA",
			timestamp: "2026-03-01T08:00:00",
			nuevo_timestamp: "2026-03-01T08:05:00",
		});

		expect(marca.update).toHaveBeenCalled();
		expect(JornadaDiaria.create).toHaveBeenCalledTimes(1);
		expect(result.jornada.horas_ordinarias).toBe(9);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("actualiza jornada existente", async () => {
		setupHappyPath();
		const updateJornada = jest.fn().mockResolvedValue(undefined);
		JornadaDiaria.findOne.mockResolvedValue({ update: updateJornada });

		await actualizarMarcaAsistencia({
			identificacion: "123456789",
			tipo_marca: "SALIDA",
			timestamp: "2026-03-01T17:00:00",
			nuevo_timestamp: "2026-03-01T17:05:00",
		});

		expect(updateJornada).toHaveBeenCalledWith({ horas_ordinarias: 9 }, { transaction });
		expect(JornadaDiaria.create).not.toHaveBeenCalled();
	});

	test("retorna entrada y salida null cuando no hay tipo de marca reconocido", async () => {
		setupHappyPath();
		MarcaAsistencia.findAll.mockResolvedValue([
			{ tipoMarca: undefined, timestamp: new Date("2026-03-01T10:00:00") },
		]);

		const result = await actualizarMarcaAsistencia({
			identificacion: "123456789",
			tipo_marca: "ENTRADA",
			timestamp: "2026-03-01T08:00:00",
			nuevo_timestamp: "2026-03-01T08:05:00",
		});

		expect(result.jornada.entrada).toBeNull();
		expect(result.jornada.salida).toBeNull();
	});

	test("hace rollback cuando ocurre error y la transacción no terminó", async () => {
		Colaborador.findOne.mockRejectedValue(new Error("db down"));

		await expect(
			actualizarMarcaAsistencia({
				identificacion: "123",
				tipo_marca: "ENTRADA",
				timestamp: "2026-03-01T08:00:00",
				nuevo_timestamp: "2026-03-01T08:05:00",
			})
		).rejects.toThrow("db down");

		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});

	test("no hace rollback cuando la transacción ya finalizó", async () => {
		transaction.finished = true;

		await expect(
			actualizarMarcaAsistencia({ identificacion: "", tipo_marca: "ENTRADA", timestamp: "2026-03-01T08:00:00" })
		).rejects.toThrow("La identificación es obligatoria");

		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
