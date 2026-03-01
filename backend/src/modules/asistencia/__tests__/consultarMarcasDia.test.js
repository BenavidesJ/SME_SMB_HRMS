import { jest } from "@jest/globals";
import { createAsistenciaModelMocks } from "../../../test-utils/asistenciaModelMocks.js";

const {
	sequelize,
	transaction,
	Colaborador,
	MarcaAsistencia,
	TipoMarca,
	reset,
} = createAsistenciaModelMocks();

jest.unstable_mockModule("../../../models/index.js", () => ({
	sequelize,
	Colaborador,
	MarcaAsistencia,
	TipoMarca,
}));

const { obtenerMarcasDeDia } = await import("../handlers/consultarMarcasDia.js");

describe("obtenerMarcasDeDia", () => {
	beforeEach(() => {
		reset();
	});

	test("valida identificación obligatoria", async () => {
		await expect(obtenerMarcasDeDia({ identificacion: "", timestamp: "2026-03-01T08:00:00" })).rejects.toThrow(
			"La identificación es obligatoria"
		);
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});

	test("valida identificación numérica", async () => {
		await expect(obtenerMarcasDeDia({ identificacion: "abc", timestamp: "2026-03-01T08:00:00" })).rejects.toThrow(
			"La identificación debe ser numérica"
		);
	});

	test("valida timestamp obligatorio", async () => {
		await expect(obtenerMarcasDeDia({ identificacion: "123", timestamp: "" })).rejects.toThrow(
			"El timestamp es obligatorio"
		);
	});

	test("valida timestamp con fecha válida", async () => {
		await expect(obtenerMarcasDeDia({ identificacion: "123", timestamp: "no-fecha" })).rejects.toThrow(
			"El timestamp no es una fecha válida"
		);
	});

	test("lanza error cuando colaborador no existe", async () => {
		Colaborador.findOne.mockResolvedValue(null);

		await expect(obtenerMarcasDeDia({ identificacion: "123", timestamp: "2026-03-01T08:00:00" })).rejects.toThrow(
			"No existe un colaborador con identificación 123"
		);
	});

	test("retorna estado SIN_MARCAS", async () => {
		Colaborador.findOne.mockResolvedValue({ id_colaborador: 2 });
		MarcaAsistencia.findAll.mockResolvedValue([]);

		const result = await obtenerMarcasDeDia({ identificacion: "123", timestamp: "2026-03-01T08:00:00" });

		expect(result.estado_marcas).toBe("SIN_MARCAS");
		expect(result.marcas).toEqual([]);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("retorna estado SOLO_ENTRADA", async () => {
		Colaborador.findOne.mockResolvedValue({ id_colaborador: 2 });
		MarcaAsistencia.findAll.mockResolvedValue([
			{ id_marca: 1, timestamp: new Date("2026-03-01T08:00:00"), tipoMarca: { nombre: "ENTRADA" } },
		]);

		const result = await obtenerMarcasDeDia({ identificacion: "123", timestamp: "2026-03-01T08:00:00" });

		expect(result.estado_marcas).toBe("SOLO_ENTRADA");
		expect(result.marcas).toHaveLength(1);
	});

	test("retorna estado ENTRADA_Y_SALIDA", async () => {
		Colaborador.findOne.mockResolvedValue({ id_colaborador: 2 });
		MarcaAsistencia.findAll.mockResolvedValue([
			{ id_marca: 1, timestamp: new Date("2026-03-01T08:00:00"), tipoMarca: { nombre: "ENTRADA" } },
			{ id_marca: 2, timestamp: new Date("2026-03-01T17:00:00"), tipoMarca: { nombre: "SALIDA" } },
		]);

		const result = await obtenerMarcasDeDia({ identificacion: "123", timestamp: "2026-03-01T08:00:00" });

		expect(result.estado_marcas).toBe("ENTRADA_Y_SALIDA");
		expect(result.marcas).toHaveLength(2);
	});

	test("cuando hay solo SALIDA mantiene estado SIN_MARCAS", async () => {
		Colaborador.findOne.mockResolvedValue({ id_colaborador: 2 });
		MarcaAsistencia.findAll.mockResolvedValue([
			{ id_marca: 2, timestamp: new Date("2026-03-01T17:00:00"), tipoMarca: { nombre: "SALIDA" } },
		]);

		const result = await obtenerMarcasDeDia({ identificacion: "123", timestamp: "2026-03-01T08:00:00" });

		expect(result.estado_marcas).toBe("SIN_MARCAS");
	});

	test("convierte tipo_marca a string vacío cuando no viene tipoMarca", async () => {
		Colaborador.findOne.mockResolvedValue({ id_colaborador: 2 });
		MarcaAsistencia.findAll.mockResolvedValue([
			{ id_marca: 3, timestamp: new Date("2026-03-01T12:00:00"), tipoMarca: undefined },
		]);

		const result = await obtenerMarcasDeDia({ identificacion: "123", timestamp: "2026-03-01T08:00:00" });

		expect(result.marcas[0].tipo_marca).toBe("");
	});

	test("no hace rollback si transacción ya finalizó", async () => {
		transaction.finished = true;
		await expect(obtenerMarcasDeDia({ identificacion: "", timestamp: "2026-03-01T08:00:00" })).rejects.toThrow();
		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
