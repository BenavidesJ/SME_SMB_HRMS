import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, TipoMarca, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { TipoMarca },
}));

const { createTipoMarca } = await import("../handlers/create.js");
const { listTiposMarca, getTipoMarca } = await import("../handlers/read.js");
const { updateTipoMarca } = await import("../handlers/update.js");
const { deleteTipoMarca } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/tipo_marca handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createTipoMarca crea y serializa", async () => {
		TipoMarca.findOne.mockResolvedValue(null);
		TipoMarca.create.mockResolvedValue({ id_tipo_marca: 2, nombre: "ENTRADA" });

		await expect(createTipoMarca({ nombre: "ENTRADA" })).resolves.toEqual({ id: 2, nombre: "ENTRADA" });
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createTipoMarca valida y evita duplicados", async () => {
		await expect(createTipoMarca({ nombre: "" })).rejects.toThrow("El campo nombre es obligatorio");

		TipoMarca.findOne.mockResolvedValue({ id_tipo_marca: 1, nombre: "ENTRADA" });
		await expect(createTipoMarca({ nombre: "ENTRADA" })).rejects.toThrow("Ya existe un tipo de marca ENTRADA");
	});

	test("listTiposMarca y getTipoMarca", async () => {
		TipoMarca.findAll.mockResolvedValue([
			{ id_tipo_marca: 1, nombre: "ENTRADA" },
			{ id_tipo_marca: 2, nombre: "SALIDA" },
		]);
		TipoMarca.findByPk.mockResolvedValue({ id_tipo_marca: 2, nombre: "SALIDA" });

		await expect(listTiposMarca()).resolves.toEqual([
			{ id: 1, nombre: "ENTRADA" },
			{ id: 2, nombre: "SALIDA" },
		]);
		await expect(getTipoMarca({ id: 2 })).resolves.toEqual({ id: 2, nombre: "SALIDA" });
	});

	test("getTipoMarca valida id y not found", async () => {
		await expect(getTipoMarca({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

		TipoMarca.findByPk.mockResolvedValue(null);
		await expect(getTipoMarca({ id: 9 })).rejects.toThrow("No existe tipo de marca con id 9");
	});

	test("updateTipoMarca actualiza y valida conflictos", async () => {
		TipoMarca.findByPk
			.mockResolvedValueOnce({ id_tipo_marca: 4, nombre: "X" })
			.mockResolvedValueOnce({ id_tipo_marca: 4, nombre: "Y" });
		TipoMarca.findOne.mockResolvedValue(null);
		TipoMarca.update.mockResolvedValue([1]);

		await expect(updateTipoMarca({ id: 4, patch: { nombre: "Y" } })).resolves.toEqual({
			id: 4,
			nombre: "Y",
		});

		await expect(updateTipoMarca({ id: 4, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		TipoMarca.findByPk.mockResolvedValue(null);
		await expect(updateTipoMarca({ id: 4, patch: { nombre: "Z" } })).rejects.toThrow(
			"No existe tipo de marca con id 4"
		);
	});

	test("deleteTipoMarca elimina y falla si no existe", async () => {
		TipoMarca.destroy.mockResolvedValue(1);
		await expect(deleteTipoMarca({ id: 7 })).resolves.toEqual({ id: 7 });

		reset();
		TipoMarca.destroy.mockResolvedValue(0);
		await expect(deleteTipoMarca({ id: 7 })).rejects.toThrow("No existe tipo de marca con id 7");
	});
});
