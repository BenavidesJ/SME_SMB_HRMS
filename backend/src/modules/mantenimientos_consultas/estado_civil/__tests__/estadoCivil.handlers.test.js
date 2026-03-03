import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, EstadoCivil, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { EstadoCivil },
}));

const { createEstadoCivil } = await import("../handlers/create.js");
const { listEstadosCiviles, getEstadoCivil } = await import("../handlers/read.js");
const { updateEstadoCivil } = await import("../handlers/update.js");
const { deleteEstadoCivil } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/estado_civil handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createEstadoCivil crea y serializa", async () => {
		EstadoCivil.findOne.mockResolvedValue(null);
		EstadoCivil.create.mockResolvedValue({ id_estado_civil: 2, estado_civil: "CASADO" });

		await expect(createEstadoCivil({ estado_civil: "casado" })).resolves.toEqual({
			id: 2,
			estado_civil: "CASADO",
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createEstadoCivil valida y evita duplicados", async () => {
		await expect(createEstadoCivil({ estado_civil: "" })).rejects.toThrow(
			"El campo estado_civil es obligatorio"
		);

		EstadoCivil.findOne.mockResolvedValue({ id_estado_civil: 1, estado_civil: "SOLTERO" });
		await expect(createEstadoCivil({ estado_civil: "soltero" })).rejects.toThrow(
			"Ya existe un estado civil SOLTERO"
		);
	});

	test("listEstadosCiviles y getEstadoCivil", async () => {
		EstadoCivil.findAll.mockResolvedValue([
			{ id_estado_civil: 1, estado_civil: "SOLTERO" },
			{ id_estado_civil: 2, estado_civil: "CASADO" },
		]);
		EstadoCivil.findByPk.mockResolvedValue({ id_estado_civil: 2, estado_civil: "CASADO" });

		await expect(listEstadosCiviles()).resolves.toEqual([
			{ id: 1, estado_civil: "SOLTERO" },
			{ id: 2, estado_civil: "CASADO" },
		]);
		await expect(getEstadoCivil({ id: 2 })).resolves.toEqual({ id: 2, estado_civil: "CASADO" });
	});

	test("getEstadoCivil valida id y not found", async () => {
		await expect(getEstadoCivil({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

		EstadoCivil.findByPk.mockResolvedValue(null);
		await expect(getEstadoCivil({ id: 3 })).rejects.toThrow("No existe estado civil con id 3");
	});

	test("updateEstadoCivil actualiza y retorna refreshed", async () => {
		EstadoCivil.findByPk
			.mockResolvedValueOnce({ id_estado_civil: 9, estado_civil: "UNION LIBRE" })
			.mockResolvedValueOnce({ id_estado_civil: 9, estado_civil: "DIVORCIADO" });
		EstadoCivil.findOne.mockResolvedValue(null);
		EstadoCivil.update.mockResolvedValue([1]);

		await expect(updateEstadoCivil({ id: 9, patch: { estado_civil: "divorciado" } })).resolves.toEqual({
			id: 9,
			estado_civil: "DIVORCIADO",
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("updateEstadoCivil valida patch, existencia y duplicado", async () => {
		await expect(updateEstadoCivil({ id: 1, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		EstadoCivil.findByPk.mockResolvedValue(null);
		await expect(updateEstadoCivil({ id: 1, patch: { estado_civil: "SOLTERO" } })).rejects.toThrow(
			"No existe estado civil con id 1"
		);

		reset();
		EstadoCivil.findByPk.mockResolvedValue({ id_estado_civil: 1, estado_civil: "X" });
		EstadoCivil.findOne.mockResolvedValue({ id_estado_civil: 2, estado_civil: "SOLTERO" });
		await expect(updateEstadoCivil({ id: 1, patch: { estado_civil: "soltero" } })).rejects.toThrow(
			"Ya existe un estado civil SOLTERO"
		);
	});

	test("deleteEstadoCivil elimina y falla si no existe", async () => {
		EstadoCivil.destroy.mockResolvedValue(1);
		await expect(deleteEstadoCivil({ id: 9 })).resolves.toEqual({ id: 9 });

		reset();
		EstadoCivil.destroy.mockResolvedValue(0);
		await expect(deleteEstadoCivil({ id: 9 })).rejects.toThrow("No existe estado civil con id 9");
	});
});
