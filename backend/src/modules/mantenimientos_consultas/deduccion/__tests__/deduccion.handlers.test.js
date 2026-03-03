import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, Deduccion, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { Deduccion },
}));

const { createDeduccion } = await import("../handlers/create.js");
const { listDeducciones, getDeduccion } = await import("../handlers/read.js");
const { updateDeduccion } = await import("../handlers/update.js");
const { deleteDeduccion } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/deduccion handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createDeduccion crea y serializa", async () => {
		Deduccion.findOne.mockResolvedValue(null);
		Deduccion.create.mockResolvedValue({ id_deduccion: 2, nombre: "CCSS", valor: "10", es_voluntaria: 1 });

		await expect(createDeduccion({ nombre: "CCSS", valor: 10, es_voluntaria: true })).resolves.toEqual({
			id: 2,
			nombre: "CCSS",
			valor: 10,
			es_voluntaria: true,
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createDeduccion valida y evita duplicados", async () => {
		await expect(createDeduccion({ nombre: "", valor: 10, es_voluntaria: true })).rejects.toThrow(
			"El campo nombre es obligatorio"
		);

		Deduccion.findOne.mockResolvedValue({ id_deduccion: 1, nombre: "CCSS" });
		await expect(createDeduccion({ nombre: "CCSS", valor: 10, es_voluntaria: true })).rejects.toThrow(
			"Ya existe una deducción con nombre CCSS"
		);
	});

	test("listDeducciones y getDeduccion", async () => {
		Deduccion.findAll.mockResolvedValue([
			{ id_deduccion: 1, nombre: "CCSS", valor: "10", es_voluntaria: 1 },
			{ id_deduccion: 2, nombre: "Banco", valor: 5, es_voluntaria: false },
		]);
		Deduccion.findByPk.mockResolvedValue({ id_deduccion: 2, nombre: "Banco", valor: "5", es_voluntaria: false });

		await expect(listDeducciones()).resolves.toEqual([
			{ id: 1, nombre: "CCSS", valor: 10, es_voluntaria: true },
			{ id: 2, nombre: "Banco", valor: 5, es_voluntaria: false },
		]);
		await expect(getDeduccion({ id: 2 })).resolves.toEqual({
			id: 2,
			nombre: "Banco",
			valor: 5,
			es_voluntaria: false,
		});
	});

	test("getDeduccion valida id y not found", async () => {
		await expect(getDeduccion({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

		Deduccion.findByPk.mockResolvedValue(null);
		await expect(getDeduccion({ id: 9 })).rejects.toThrow("No existe deducción con id 9");
	});

	test("updateDeduccion actualiza y valida conflictos", async () => {
		Deduccion.findByPk
			.mockResolvedValueOnce({ id_deduccion: 4, nombre: "X", valor: 1, es_voluntaria: false })
			.mockResolvedValueOnce({ id_deduccion: 4, nombre: "Y", valor: 2, es_voluntaria: true });
		Deduccion.findOne.mockResolvedValue(null);
		Deduccion.update.mockResolvedValue([1]);

		await expect(updateDeduccion({ id: 4, patch: { nombre: "Y", valor: 2, es_voluntaria: true } })).resolves.toEqual({
			id: 4,
			nombre: "Y",
			valor: 2,
			es_voluntaria: true,
		});

		await expect(updateDeduccion({ id: 4, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		Deduccion.findByPk.mockResolvedValue(null);
		await expect(updateDeduccion({ id: 4, patch: { nombre: "Z" } })).rejects.toThrow(
			"No existe deducción con id 4"
		);
	});

	test("deleteDeduccion elimina y falla si no existe", async () => {
		Deduccion.destroy.mockResolvedValue(1);
		await expect(deleteDeduccion({ id: 7 })).resolves.toEqual({ id: 7 });

		reset();
		Deduccion.destroy.mockResolvedValue(0);
		await expect(deleteDeduccion({ id: 7 })).rejects.toThrow("No existe deducción con id 7");
	});
});
