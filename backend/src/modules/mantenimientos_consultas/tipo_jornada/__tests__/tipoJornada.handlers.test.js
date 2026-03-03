import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, TipoJornada, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { TipoJornada },
}));

const { createTipoJornada } = await import("../handlers/create.js");
const { listTiposJornada, getTipoJornada } = await import("../handlers/read.js");
const { updateTipoJornada } = await import("../handlers/update.js");
const { deleteTipoJornada } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/tipo_jornada handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createTipoJornada crea registro válido", async () => {
		TipoJornada.findOne.mockResolvedValue(null);
		TipoJornada.create.mockResolvedValue({
			id_tipo_jornada: 4,
			tipo: "DIURNA",
			max_horas_diarias: 8,
			max_horas_semanales: 48,
		});

		await expect(
			createTipoJornada({ tipo: "DIURNA", max_horas_diarias: "8", max_horas_semanales: "48" })
		).resolves.toEqual({
			id: 4,
			tipo: "DIURNA",
			max_horas_diarias: 8,
			max_horas_semanales: 48,
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createTipoJornada valida campos y duplicados", async () => {
		await expect(createTipoJornada({ tipo: "", max_horas_diarias: 8, max_horas_semanales: 48 })).rejects.toThrow(
			"El campo tipo es obligatorio"
		);
		await expect(
			createTipoJornada({ tipo: "X", max_horas_diarias: -1, max_horas_semanales: 48 })
		).rejects.toThrow("El campo max_horas_diarias debe ser mayor o igual a 0");

		TipoJornada.findOne.mockResolvedValue({ id_tipo_jornada: 1, tipo: "DIURNA" });
		await expect(
			createTipoJornada({ tipo: "DIURNA", max_horas_diarias: 8, max_horas_semanales: 48 })
		).rejects.toThrow("Ya existe un tipo de jornada DIURNA");
	});

	test("listTiposJornada y getTipoJornada serializan respuesta", async () => {
		TipoJornada.findAll.mockResolvedValue([
			{ id_tipo_jornada: 1, tipo: "DIURNA", max_horas_diarias: "8", max_horas_semanales: "48" },
			{ id_tipo_jornada: 2, tipo: "NOCTURNA", max_horas_diarias: 6, max_horas_semanales: 36 },
		]);
		TipoJornada.findByPk.mockResolvedValue({
			id_tipo_jornada: 2,
			tipo: "NOCTURNA",
			max_horas_diarias: "6",
			max_horas_semanales: "36",
		});

		await expect(listTiposJornada()).resolves.toEqual([
			{ id: 1, tipo: "DIURNA", max_horas_diarias: 8, max_horas_semanales: 48 },
			{ id: 2, tipo: "NOCTURNA", max_horas_diarias: 6, max_horas_semanales: 36 },
		]);
		await expect(getTipoJornada({ id: 2 })).resolves.toEqual({
			id: 2,
			tipo: "NOCTURNA",
			max_horas_diarias: 6,
			max_horas_semanales: 36,
		});
	});

	test("getTipoJornada valida id y not found", async () => {
		await expect(getTipoJornada({ id: "foo" })).rejects.toThrow("El campo id debe ser un entero positivo");

		TipoJornada.findByPk.mockResolvedValue(null);
		await expect(getTipoJornada({ id: 7 })).rejects.toThrow("No existe tipo de jornada con id 7");
	});

	test("updateTipoJornada actualiza completo", async () => {
		TipoJornada.findByPk
			.mockResolvedValueOnce({ id_tipo_jornada: 5, tipo: "DIURNA", max_horas_diarias: 8, max_horas_semanales: 48 })
			.mockResolvedValueOnce({ id_tipo_jornada: 5, tipo: "MIXTA", max_horas_diarias: 7, max_horas_semanales: 42 });
		TipoJornada.findOne.mockResolvedValue(null);
		TipoJornada.update.mockResolvedValue([1]);

		const result = await updateTipoJornada({
			id: 5,
			patch: { tipo: "MIXTA", max_horas_diarias: 7, max_horas_semanales: 42 },
		});

		expect(result).toEqual({ id: 5, tipo: "MIXTA", max_horas_diarias: 7, max_horas_semanales: 42 });
	});

	test("updateTipoJornada soporta patch parcial y valida errores", async () => {
		TipoJornada.findByPk
			.mockResolvedValueOnce({ id_tipo_jornada: 6, tipo: "DIURNA", max_horas_diarias: 8, max_horas_semanales: 48 })
			.mockResolvedValueOnce({ id_tipo_jornada: 6, tipo: "DIURNA", max_horas_diarias: 8, max_horas_semanales: 48 });
		TipoJornada.findOne.mockResolvedValue(null);
		TipoJornada.update.mockResolvedValue([1]);

		await expect(
			updateTipoJornada({ id: 6, patch: { tipo: undefined, max_horas_diarias: undefined, max_horas_semanales: undefined } })
		).resolves.toEqual({ id: 6, tipo: "DIURNA", max_horas_diarias: 8, max_horas_semanales: 48 });

		await expect(updateTipoJornada({ id: 6, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		TipoJornada.findByPk.mockResolvedValue(null);
		await expect(updateTipoJornada({ id: 6, patch: { tipo: "MIXTA" } })).rejects.toThrow(
			"No existe tipo de jornada con id 6"
		);

		reset();
		TipoJornada.findByPk.mockResolvedValue({ id_tipo_jornada: 6, tipo: "DIURNA", max_horas_diarias: 8, max_horas_semanales: 48 });
		TipoJornada.findOne.mockResolvedValue({ id_tipo_jornada: 2, tipo: "MIXTA", max_horas_diarias: 7, max_horas_semanales: 42 });
		await expect(updateTipoJornada({ id: 6, patch: { tipo: "MIXTA" } })).rejects.toThrow(
			"Ya existe un tipo de jornada MIXTA"
		);
	});

	test("deleteTipoJornada elimina y falla si no existe", async () => {
		TipoJornada.destroy.mockResolvedValue(1);
		await expect(deleteTipoJornada({ id: 4 })).resolves.toEqual({ id: 4 });

		reset();
		TipoJornada.destroy.mockResolvedValue(0);
		await expect(deleteTipoJornada({ id: 4 })).rejects.toThrow("No existe tipo de jornada con id 4");
	});
});
