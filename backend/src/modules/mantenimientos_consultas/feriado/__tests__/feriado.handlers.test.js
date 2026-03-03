import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, Feriado, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { Feriado },
}));

const { createFeriado } = await import("../handlers/create.js");
const { listFeriados, getFeriado } = await import("../handlers/read.js");
const { updateFeriado } = await import("../handlers/update.js");
const { deleteFeriado } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/feriado handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createFeriado crea y serializa", async () => {
		Feriado.findOne.mockResolvedValue(null);
		Feriado.create.mockResolvedValue({ id_feriado: 2, fecha: "2026-03-19", nombre: "San José", es_obligatorio: 1 });

		await expect(createFeriado({ fecha: "2026-03-19", nombre: "San José", es_obligatorio: true })).resolves.toEqual({
			id: 2,
			fecha: "2026-03-19",
			nombre: "San José",
			es_obligatorio: true,
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createFeriado valida campos y evita duplicados", async () => {
		await expect(createFeriado({ fecha: "", nombre: "x", es_obligatorio: true })).rejects.toThrow(
			"El campo fecha es obligatorio"
		);

		Feriado.findOne.mockResolvedValue({ id_feriado: 1, fecha: "2026-03-19" });
		await expect(createFeriado({ fecha: "2026-03-19", nombre: "San José", es_obligatorio: true })).rejects.toThrow(
			"Ya existe un feriado registrado para la fecha 2026-03-19"
		);
	});

	test("listFeriados y getFeriado", async () => {
		Feriado.findAll.mockResolvedValue([
			{ id_feriado: 1, fecha: "2026-01-01", nombre: "Año Nuevo", es_obligatorio: true },
			{ id_feriado: 2, fecha: "2026-04-11", nombre: "Juan Santamaría", es_obligatorio: false },
		]);
		Feriado.findByPk.mockResolvedValue({ id_feriado: 2, fecha: "2026-04-11", nombre: "Juan Santamaría", es_obligatorio: false });

		await expect(listFeriados()).resolves.toEqual([
			{ id: 1, fecha: "2026-01-01", nombre: "Año Nuevo", es_obligatorio: true },
			{ id: 2, fecha: "2026-04-11", nombre: "Juan Santamaría", es_obligatorio: false },
		]);
		await expect(getFeriado({ id: 2 })).resolves.toEqual({
			id: 2,
			fecha: "2026-04-11",
			nombre: "Juan Santamaría",
			es_obligatorio: false,
		});
	});

	test("getFeriado valida id y not found", async () => {
		await expect(getFeriado({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

		Feriado.findByPk.mockResolvedValue(null);
		await expect(getFeriado({ id: 9 })).rejects.toThrow("No existe feriado con id 9");
	});

	test("updateFeriado actualiza y valida conflictos", async () => {
		Feriado.findByPk
			.mockResolvedValueOnce({ id_feriado: 4, fecha: "2026-03-19", nombre: "X", es_obligatorio: true })
			.mockResolvedValueOnce({ id_feriado: 4, fecha: "2026-03-20", nombre: "Y", es_obligatorio: false });
		Feriado.findOne.mockResolvedValue(null);
		Feriado.update.mockResolvedValue([1]);

		await expect(
			updateFeriado({ id: 4, patch: { fecha: "2026-03-20", nombre: "Y", es_obligatorio: false } })
		).resolves.toEqual({ id: 4, fecha: "2026-03-20", nombre: "Y", es_obligatorio: false });

		await expect(updateFeriado({ id: 4, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		Feriado.findByPk.mockResolvedValue(null);
		await expect(updateFeriado({ id: 4, patch: { nombre: "Z" } })).rejects.toThrow("No existe feriado con id 4");
	});

	test("deleteFeriado elimina y falla si no existe", async () => {
		Feriado.destroy.mockResolvedValue(1);
		await expect(deleteFeriado({ id: 7 })).resolves.toEqual({ id: 7 });

		reset();
		Feriado.destroy.mockResolvedValue(0);
		await expect(deleteFeriado({ id: 7 })).rejects.toThrow("No existe feriado con id 7");
	});
});
