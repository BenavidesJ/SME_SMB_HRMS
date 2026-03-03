import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, TipoIncapacidad, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { TipoIncapacidad },
}));

const { createTipoIncapacidad } = await import("../handlers/create.js");
const { listTiposIncapacidad, getTipoIncapacidad } = await import("../handlers/read.js");
const { updateTipoIncapacidad } = await import("../handlers/update.js");
const { deleteTipoIncapacidad } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/tipo_incapacidad handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createTipoIncapacidad crea y serializa", async () => {
		TipoIncapacidad.findOne.mockResolvedValue(null);
		TipoIncapacidad.create.mockResolvedValue({ id_tipo_incap: 2, nombre: "CCSS" });

		await expect(createTipoIncapacidad({ nombre: "CCSS" })).resolves.toEqual({ id: 2, nombre: "CCSS" });
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createTipoIncapacidad valida y evita duplicados", async () => {
		await expect(createTipoIncapacidad({ nombre: "" })).rejects.toThrow("El campo nombre es obligatorio");

		TipoIncapacidad.findOne.mockResolvedValue({ id_tipo_incap: 1, nombre: "CCSS" });
		await expect(createTipoIncapacidad({ nombre: "CCSS" })).rejects.toThrow(
			"Ya existe un tipo de incapacidad CCSS"
		);
	});

	test("listTiposIncapacidad y getTipoIncapacidad", async () => {
		TipoIncapacidad.findAll.mockResolvedValue([
			{ id_tipo_incap: 1, nombre: "CCSS" },
			{ id_tipo_incap: 2, nombre: "INS" },
		]);
		TipoIncapacidad.findByPk.mockResolvedValue({ id_tipo_incap: 2, nombre: "INS" });

		await expect(listTiposIncapacidad()).resolves.toEqual([
			{ id: 1, nombre: "CCSS" },
			{ id: 2, nombre: "INS" },
		]);
		await expect(getTipoIncapacidad({ id: 2 })).resolves.toEqual({ id: 2, nombre: "INS" });
	});

	test("getTipoIncapacidad valida id y not found", async () => {
		await expect(getTipoIncapacidad({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

		TipoIncapacidad.findByPk.mockResolvedValue(null);
		await expect(getTipoIncapacidad({ id: 9 })).rejects.toThrow("No existe tipo de incapacidad con id 9");
	});

	test("updateTipoIncapacidad actualiza y valida conflictos", async () => {
		TipoIncapacidad.findByPk
			.mockResolvedValueOnce({ id_tipo_incap: 4, nombre: "X" })
			.mockResolvedValueOnce({ id_tipo_incap: 4, nombre: "Y" });
		TipoIncapacidad.findOne.mockResolvedValue(null);
		TipoIncapacidad.update.mockResolvedValue([1]);

		await expect(updateTipoIncapacidad({ id: 4, patch: { nombre: "Y" } })).resolves.toEqual({
			id: 4,
			nombre: "Y",
		});

		await expect(updateTipoIncapacidad({ id: 4, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		TipoIncapacidad.findByPk.mockResolvedValue(null);
		await expect(updateTipoIncapacidad({ id: 4, patch: { nombre: "Z" } })).rejects.toThrow(
			"No existe tipo de incapacidad con id 4"
		);
	});

	test("deleteTipoIncapacidad elimina y falla si no existe", async () => {
		TipoIncapacidad.destroy.mockResolvedValue(1);
		await expect(deleteTipoIncapacidad({ id: 7 })).resolves.toEqual({ id: 7 });

		reset();
		TipoIncapacidad.destroy.mockResolvedValue(0);
		await expect(deleteTipoIncapacidad({ id: 7 })).rejects.toThrow("No existe tipo de incapacidad con id 7");
	});
});
