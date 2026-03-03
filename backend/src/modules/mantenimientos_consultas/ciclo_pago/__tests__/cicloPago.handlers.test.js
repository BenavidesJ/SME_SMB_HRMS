import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, CicloPago, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { CicloPago },
}));

const { createCicloPago } = await import("../handlers/create.js");
const { listCiclosPago, getCicloPago } = await import("../handlers/read.js");
const { updateCicloPago } = await import("../handlers/update.js");
const { deleteCicloPago } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/ciclo_pago handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createCicloPago crea y serializa", async () => {
		CicloPago.findByPk.mockResolvedValue(null);
		CicloPago.create.mockResolvedValue({ id_ciclo_pago: 2, ciclo_pago: "QUINCENAL" });

		await expect(createCicloPago({ id_ciclo_pago: 2, ciclo_pago: "QUINCENAL" })).resolves.toEqual({
			id: 2,
			ciclo_pago: "QUINCENAL",
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createCicloPago valida y evita id duplicado", async () => {
		await expect(createCicloPago({ id_ciclo_pago: "x", ciclo_pago: "A" })).rejects.toThrow(
			"El campo id_ciclo_pago debe ser un entero positivo"
		);

		CicloPago.findByPk.mockResolvedValue({ id_ciclo_pago: 2, ciclo_pago: "QUINCENAL" });
		await expect(createCicloPago({ id_ciclo_pago: 2, ciclo_pago: "QUINCENAL" })).rejects.toThrow(
			"Ya existe un ciclo de pago con id 2"
		);
	});

	test("listCiclosPago y getCicloPago", async () => {
		CicloPago.findAll.mockResolvedValue([
			{ id_ciclo_pago: 1, ciclo_pago: "SEMANAL" },
			{ id_ciclo_pago: 2, ciclo_pago: "QUINCENAL" },
		]);
		CicloPago.findByPk.mockResolvedValue({ id_ciclo_pago: 2, ciclo_pago: "QUINCENAL" });

		await expect(listCiclosPago()).resolves.toEqual([
			{ id: 1, ciclo_pago: "SEMANAL" },
			{ id: 2, ciclo_pago: "QUINCENAL" },
		]);
		await expect(getCicloPago({ id: 2 })).resolves.toEqual({ id: 2, ciclo_pago: "QUINCENAL" });
	});

	test("getCicloPago valida id y not found", async () => {
		await expect(getCicloPago({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

		CicloPago.findByPk.mockResolvedValue(null);
		await expect(getCicloPago({ id: 9 })).rejects.toThrow("No existe ciclo de pago con id 9");
	});

	test("updateCicloPago actualiza y valida conflictos", async () => {
		CicloPago.findByPk
			.mockResolvedValueOnce({ id_ciclo_pago: 4, ciclo_pago: "X" })
			.mockResolvedValueOnce({ id_ciclo_pago: 4, ciclo_pago: "Y" });
		CicloPago.update.mockResolvedValue([1]);

		await expect(updateCicloPago({ id: 4, patch: { ciclo_pago: "Y" } })).resolves.toEqual({
			id: 4,
			ciclo_pago: "Y",
		});

		await expect(updateCicloPago({ id: 4, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		CicloPago.findByPk.mockResolvedValue(null);
		await expect(updateCicloPago({ id: 4, patch: { ciclo_pago: "Z" } })).rejects.toThrow(
			"No existe ciclo de pago con id 4"
		);
	});

	test("deleteCicloPago elimina y falla si no existe", async () => {
		CicloPago.destroy.mockResolvedValue(1);
		await expect(deleteCicloPago({ id: 7 })).resolves.toEqual({ id: 7 });

		reset();
		CicloPago.destroy.mockResolvedValue(0);
		await expect(deleteCicloPago({ id: 7 })).rejects.toThrow("No existe ciclo de pago con id 7");
	});
});
