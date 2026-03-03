import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, Estado, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { Estado },
}));

const { createEstado } = await import("../handlers/create.js");
const { listEstados, getEstado } = await import("../handlers/read.js");
const { updateEstado } = await import("../handlers/update.js");
const { deleteEstado } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/estado handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createEstado crea y serializa", async () => {
		Estado.findOne.mockResolvedValue(null);
		Estado.create.mockResolvedValue({ id_estado: 2, estado: "ACTIVO" });

		await expect(createEstado({ estado: "activo" })).resolves.toEqual({ id: 2, estado: "ACTIVO" });
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createEstado valida y evita duplicados", async () => {
		await expect(createEstado({ estado: "" })).rejects.toThrow("El campo estado es obligatorio");

		Estado.findOne.mockResolvedValue({ id_estado: 1, estado: "ACTIVO" });
		await expect(createEstado({ estado: "ACTIVO" })).rejects.toThrow("Ya existe un estado: ACTIVO");
	});

	test("listEstados y getEstado", async () => {
		Estado.findAll.mockResolvedValue([
			{ id_estado: 1, estado: "ACTIVO" },
			{ id_estado: 2, estado: "INACTIVO" },
		]);
		Estado.findByPk.mockResolvedValue({ id_estado: 2, estado: "INACTIVO" });

		await expect(listEstados()).resolves.toEqual([
			{ id: 1, estado: "ACTIVO" },
			{ id: 2, estado: "INACTIVO" },
		]);
		await expect(getEstado({ id: 2 })).resolves.toEqual({ id: 2, estado: "INACTIVO" });
	});

	test("getEstado valida id y not found", async () => {
		await expect(getEstado({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

		Estado.findByPk.mockResolvedValue(null);
		await expect(getEstado({ id: 7 })).rejects.toThrow("No existe estado con id 7");
	});

	test("updateEstado actualiza y retorna refreshed", async () => {
		Estado.findOne.mockResolvedValue(null);
		Estado.update.mockResolvedValue([1]);
		Estado.findByPk.mockResolvedValue({ id_estado: 3, estado: "PENDIENTE" });

		await expect(updateEstado({ id: 3, patch: { estado: "pendiente" } })).resolves.toEqual({
			id: 3,
			estado: "PENDIENTE",
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("updateEstado valida patch, duplicado y no encontrado", async () => {
		await expect(updateEstado({ id: 3, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		Estado.findOne.mockResolvedValue({ id_estado: 4, estado: "ACTIVO" });
		await expect(updateEstado({ id: 3, patch: { estado: "activo" } })).rejects.toThrow(
			"Ya existe un estado: ACTIVO"
		);

		reset();
		Estado.findOne.mockResolvedValue(null);
		Estado.update.mockResolvedValue([0]);
		await expect(updateEstado({ id: 3, patch: { estado: "suspendido" } })).rejects.toThrow(
			"No existe estado con id 3"
		);
	});

	test("deleteEstado elimina y falla si no existe", async () => {
		Estado.destroy.mockResolvedValue(1);
		await expect(deleteEstado({ id: 9 })).resolves.toEqual({ id: 9 });

		reset();
		Estado.destroy.mockResolvedValue(0);
		await expect(deleteEstado({ id: 9 })).rejects.toThrow("No existe estado con id 9");
	});
});
