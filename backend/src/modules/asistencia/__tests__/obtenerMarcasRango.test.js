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

const { obtenerMarcasAsistenciaPorRango } = await import("../handlers/obtenerMarcasRango.js");

describe("obtenerMarcasAsistenciaPorRango", () => {
	beforeEach(() => {
		reset();
	});

	test("valida identificación numérica", async () => {
		await expect(
			obtenerMarcasAsistenciaPorRango({ identificacion: "abc", desde: "2026-03-01", hasta: "2026-03-10" })
		).rejects.toThrow("identificacion debe ser numérica");
	});

	test("valida fecha desde", async () => {
		await expect(
			obtenerMarcasAsistenciaPorRango({ identificacion: "123", desde: "x", hasta: "2026-03-10" })
		).rejects.toThrow("desde inválido. Use YYYY-MM-DD");
	});

	test("valida fecha hasta", async () => {
		await expect(
			obtenerMarcasAsistenciaPorRango({ identificacion: "123", desde: "2026-03-01", hasta: "x" })
		).rejects.toThrow("hasta inválido. Use YYYY-MM-DD");
	});

	test("valida que hasta no sea menor que desde", async () => {
		await expect(
			obtenerMarcasAsistenciaPorRango({ identificacion: "123", desde: "2026-03-10", hasta: "2026-03-01" })
		).rejects.toThrow("hasta no puede ser menor que desde");
	});

	test("lanza error si colaborador no existe", async () => {
		Colaborador.findOne.mockResolvedValue(null);

		await expect(
			obtenerMarcasAsistenciaPorRango({ identificacion: "123", desde: "2026-03-01", hasta: "2026-03-10" })
		).rejects.toThrow("No existe un colaborador con identificación 123");
	});

	test("valida tipo_marca", async () => {
		Colaborador.findOne.mockResolvedValue({ id_colaborador: 2 });

		await expect(
			obtenerMarcasAsistenciaPorRango({
				identificacion: "123",
				desde: "2026-03-01",
				hasta: "2026-03-10",
				tipo_marca: "PAUSA",
			})
		).rejects.toThrow("tipo_marca debe ser ENTRADA o SALIDA");
	});

	test("retorna marcas agrupadas sin filtro de tipo", async () => {
		Colaborador.findOne.mockResolvedValue({ id_colaborador: 2, identificacion: 123 });
		MarcaAsistencia.findAll.mockResolvedValue([
			{ id_marca: 1, timestamp: new Date("2026-03-02T08:00:00"), tipoMarca: { nombre: "ENTRADA" } },
			{ id_marca: 2, timestamp: new Date("2026-03-01T17:00:00"), tipoMarca: { nombre: "SALIDA" } },
		]);

		const result = await obtenerMarcasAsistenciaPorRango({
			identificacion: "123",
			desde: "2026-03-01",
			hasta: "2026-03-10",
		});

		expect(result.total).toBe(2);
		expect(result.filtro.tipo_marca).toBeNull();
		expect(result.marcas).toHaveLength(2);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("aplica filtro por tipo_marca", async () => {
		Colaborador.findOne.mockResolvedValue({ id_colaborador: 2, identificacion: 123 });
		MarcaAsistencia.findAll.mockResolvedValue([
			{ id_marca: 1, timestamp: new Date("2026-03-02T08:00:00"), tipoMarca: { nombre: "ENTRADA" } },
		]);

		const result = await obtenerMarcasAsistenciaPorRango({
			identificacion: "123",
			desde: "2026-03-01",
			hasta: "2026-03-10",
			tipo_marca: "entrada",
		});

		expect(result.filtro.tipo_marca).toBe("ENTRADA");
		expect(MarcaAsistencia.findAll).toHaveBeenCalledWith(
			expect.objectContaining({
				include: [
					expect.objectContaining({
						required: true,
						where: { nombre: "ENTRADA" },
					}),
				],
			})
		);
	});

	test("mapea tipo_marca como null cuando no viene relación", async () => {
		Colaborador.findOne.mockResolvedValue({ id_colaborador: 2, identificacion: 123 });
		MarcaAsistencia.findAll.mockResolvedValue([
			{ id_marca: 1, timestamp: new Date("2026-03-02T08:00:00"), tipoMarca: undefined },
		]);

		const result = await obtenerMarcasAsistenciaPorRango({
			identificacion: "123",
			desde: "2026-03-01",
			hasta: "2026-03-10",
		});

		expect(result.marcas[0].asistencia[0].tipo_marca).toBeNull();
	});

	test("no hace rollback si transacción ya finalizó", async () => {
		transaction.finished = true;

		await expect(
			obtenerMarcasAsistenciaPorRango({ identificacion: "abc", desde: "2026-03-01", hasta: "2026-03-10" })
		).rejects.toThrow("identificacion debe ser numérica");

		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
