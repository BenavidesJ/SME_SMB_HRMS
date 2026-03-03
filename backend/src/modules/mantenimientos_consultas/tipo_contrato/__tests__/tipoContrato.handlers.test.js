import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, TipoContrato, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { TipoContrato },
}));

const { createTipoContrato } = await import("../handlers/create.js");
const { listTiposContrato, getTipoContrato } = await import("../handlers/read.js");
const { updateTipoContrato } = await import("../handlers/update.js");
const { deleteTipoContrato } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/tipo_contrato handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createTipoContrato crea y serializa", async () => {
		TipoContrato.findOne.mockResolvedValue(null);
		TipoContrato.create.mockResolvedValue({ id_tipo_contrato: 3, tipo_contrato: "FIJO" });

		await expect(createTipoContrato({ tipo_contrato: "FIJO" })).resolves.toEqual({
			id: 3,
			tipo_contrato: "FIJO",
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createTipoContrato valida y evita duplicados", async () => {
		await expect(createTipoContrato({ tipo_contrato: "   " })).rejects.toThrow(
			"El campo tipo_contrato es obligatorio"
		);

		TipoContrato.findOne.mockResolvedValue({ id_tipo_contrato: 1, tipo_contrato: "FIJO" });
		await expect(createTipoContrato({ tipo_contrato: "FIJO" })).rejects.toThrow(
			"Ya existe tipo de contrato FIJO"
		);
	});

	test("listTiposContrato y getTipoContrato", async () => {
		TipoContrato.findAll.mockResolvedValue([
			{ id_tipo_contrato: 1, tipo_contrato: "FIJO" },
			{ id_tipo_contrato: 2, tipo_contrato: "TEMPORAL" },
		]);
		TipoContrato.findByPk.mockResolvedValue({ id_tipo_contrato: 2, tipo_contrato: "TEMPORAL" });

		await expect(listTiposContrato()).resolves.toEqual([
			{ id: 1, tipo_contrato: "FIJO" },
			{ id: 2, tipo_contrato: "TEMPORAL" },
		]);
		await expect(getTipoContrato({ id: 2 })).resolves.toEqual({ id: 2, tipo_contrato: "TEMPORAL" });
	});

	test("getTipoContrato valida id y not found", async () => {
		await expect(getTipoContrato({ id: "x" })).rejects.toThrow("El campo id debe ser un entero positivo");

		TipoContrato.findByPk.mockResolvedValue(null);
		await expect(getTipoContrato({ id: 7 })).rejects.toThrow("No existe tipo de contrato con id 7");
	});

	test("updateTipoContrato actualiza, valida patch y not found", async () => {
		TipoContrato.findByPk
			.mockResolvedValueOnce({ id_tipo_contrato: 9, tipo_contrato: "A" })
			.mockResolvedValueOnce({ id_tipo_contrato: 9, tipo_contrato: "B" });
		TipoContrato.findOne.mockResolvedValue(null);
		TipoContrato.update.mockResolvedValue([1]);

		await expect(updateTipoContrato({ id: 9, patch: { tipo_contrato: "B" } })).resolves.toEqual({
			id: 9,
			tipo_contrato: "B",
		});

		await expect(updateTipoContrato({ id: 9, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		TipoContrato.findByPk.mockResolvedValue(null);
		await expect(updateTipoContrato({ id: 9, patch: { tipo_contrato: "C" } })).rejects.toThrow(
			"No existe tipo de contrato con id 9"
		);
	});

	test("updateTipoContrato detecta duplicado", async () => {
		TipoContrato.findByPk.mockResolvedValue({ id_tipo_contrato: 9, tipo_contrato: "A" });
		TipoContrato.findOne.mockResolvedValue({ id_tipo_contrato: 2, tipo_contrato: "B" });

		await expect(updateTipoContrato({ id: 9, patch: { tipo_contrato: "B" } })).rejects.toThrow(
			"Ya existe tipo de contrato B"
		);
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});

	test("deleteTipoContrato elimina y falla si no existe", async () => {
		TipoContrato.destroy.mockResolvedValue(1);
		await expect(deleteTipoContrato({ id: 5 })).resolves.toEqual({ id: 5 });

		reset();
		TipoContrato.destroy.mockResolvedValue(0);
		await expect(deleteTipoContrato({ id: 5 })).rejects.toThrow("No existe tipo de contrato con id 5");
	});
});
