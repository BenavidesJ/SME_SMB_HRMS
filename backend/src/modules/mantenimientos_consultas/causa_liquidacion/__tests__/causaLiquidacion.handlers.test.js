import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, CausaLiquidacion, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { CausaLiquidacion },
}));

const { createCausaLiquidacion } = await import("../handlers/create.js");
const { listCausasLiquidacion, getCausaLiquidacion } = await import("../handlers/read.js");
const { updateCausaLiquidacion } = await import("../handlers/update.js");
const { deleteCausaLiquidacion } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/causa_liquidacion handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createCausaLiquidacion crea y serializa", async () => {
		CausaLiquidacion.findOne.mockResolvedValue(null);
		CausaLiquidacion.create.mockResolvedValue({ id_causa_liquidacion: 2, causa_liquidacion: "Renuncia" });

		await expect(createCausaLiquidacion({ causa_liquidacion: "Renuncia" })).resolves.toEqual({
			id: 2,
			causa_liquidacion: "Renuncia",
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createCausaLiquidacion valida y evita duplicados", async () => {
		await expect(createCausaLiquidacion({ causa_liquidacion: "" })).rejects.toThrow(
			"El campo causa_liquidacion es obligatorio"
		);

		CausaLiquidacion.findOne.mockResolvedValue({ id_causa_liquidacion: 1, causa_liquidacion: "Renuncia" });
		await expect(createCausaLiquidacion({ causa_liquidacion: "Renuncia" })).rejects.toThrow(
			"Ya existe una causa de liquidación con descripción Renuncia"
		);
	});

	test("listCausasLiquidacion y getCausaLiquidacion", async () => {
		CausaLiquidacion.findAll.mockResolvedValue([
			{ id_causa_liquidacion: 1, causa_liquidacion: "Renuncia" },
			{ id_causa_liquidacion: 2, causa_liquidacion: "Despido" },
		]);
		CausaLiquidacion.findByPk.mockResolvedValue({ id_causa_liquidacion: 2, causa_liquidacion: "Despido" });

		await expect(listCausasLiquidacion()).resolves.toEqual([
			{ id: 1, causa_liquidacion: "Renuncia" },
			{ id: 2, causa_liquidacion: "Despido" },
		]);
		await expect(getCausaLiquidacion({ id: 2 })).resolves.toEqual({
			id: 2,
			causa_liquidacion: "Despido",
		});
	});

	test("getCausaLiquidacion valida id y not found", async () => {
		await expect(getCausaLiquidacion({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

		CausaLiquidacion.findByPk.mockResolvedValue(null);
		await expect(getCausaLiquidacion({ id: 9 })).rejects.toThrow("No existe causa de liquidación con id 9");
	});

	test("updateCausaLiquidacion actualiza y valida conflictos", async () => {
		CausaLiquidacion.findOne.mockResolvedValue(null);
		CausaLiquidacion.update.mockResolvedValue([1]);
		CausaLiquidacion.findByPk.mockResolvedValue({ id_causa_liquidacion: 4, causa_liquidacion: "Mutuo acuerdo" });

		await expect(
			updateCausaLiquidacion({ id: 4, patch: { causa_liquidacion: "Mutuo acuerdo" } })
		).resolves.toEqual({ id: 4, causa_liquidacion: "Mutuo acuerdo" });

		await expect(updateCausaLiquidacion({ id: 4, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		CausaLiquidacion.update.mockResolvedValue([0]);
		await expect(updateCausaLiquidacion({ id: 4, patch: { causa_liquidacion: "Otra" } })).rejects.toThrow(
			"No existe causa de liquidación con id 4"
		);
	});

	test("deleteCausaLiquidacion elimina y falla si no existe", async () => {
		CausaLiquidacion.destroy.mockResolvedValue(1);
		await expect(deleteCausaLiquidacion({ id: 7 })).resolves.toEqual({ id: 7 });

		reset();
		CausaLiquidacion.destroy.mockResolvedValue(0);
		await expect(deleteCausaLiquidacion({ id: 7 })).rejects.toThrow("No existe causa de liquidación con id 7");
	});
});
