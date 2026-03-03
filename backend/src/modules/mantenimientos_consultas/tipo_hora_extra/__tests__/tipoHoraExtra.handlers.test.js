import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, TipoHoraExtra, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { TipoHoraExtra },
}));

const { createTipoHoraExtra } = await import("../handlers/create.js");
const { listTiposHoraExtra, getTipoHoraExtra } = await import("../handlers/read.js");
const { updateTipoHoraExtra } = await import("../handlers/update.js");
const { deleteTipoHoraExtra } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/tipo_hora_extra handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createTipoHoraExtra crea registro válido", async () => {
		TipoHoraExtra.findOne.mockResolvedValue(null);
		TipoHoraExtra.create.mockResolvedValue({ id_tipo_hx: 3, nombre: "DOBLE", multiplicador: 2 });

		await expect(createTipoHoraExtra({ nombre: "DOBLE", multiplicador: "2" })).resolves.toEqual({
			id: 3,
			nombre: "DOBLE",
			multiplicador: 2,
		});
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("createTipoHoraExtra valida campos y duplicados", async () => {
		await expect(createTipoHoraExtra({ nombre: "", multiplicador: 2 })).rejects.toThrow(
			"El campo nombre es obligatorio"
		);
		await expect(createTipoHoraExtra({ nombre: "DOBLE", multiplicador: "x" })).rejects.toThrow(
			"El campo multiplicador debe ser numérico"
		);

		TipoHoraExtra.findOne.mockResolvedValue({ id_tipo_hx: 1, nombre: "DOBLE" });
		await expect(createTipoHoraExtra({ nombre: "DOBLE", multiplicador: 2 })).rejects.toThrow(
			"Ya existe un tipo de hora extra DOBLE"
		);
	});

	test("listTiposHoraExtra y getTipoHoraExtra serializan respuesta", async () => {
		TipoHoraExtra.findAll.mockResolvedValue([
			{ id_tipo_hx: 1, nombre: "DOBLE", multiplicador: "2" },
			{ id_tipo_hx: 2, nombre: "TRIPLE", multiplicador: 3 },
		]);
		TipoHoraExtra.findByPk.mockResolvedValue({ id_tipo_hx: 2, nombre: "TRIPLE", multiplicador: "3" });

		await expect(listTiposHoraExtra()).resolves.toEqual([
			{ id: 1, nombre: "DOBLE", multiplicador: 2 },
			{ id: 2, nombre: "TRIPLE", multiplicador: 3 },
		]);
		await expect(getTipoHoraExtra({ id: 2 })).resolves.toEqual({ id: 2, nombre: "TRIPLE", multiplicador: 3 });
	});

	test("getTipoHoraExtra valida id y not found", async () => {
		await expect(getTipoHoraExtra({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

		TipoHoraExtra.findByPk.mockResolvedValue(null);
		await expect(getTipoHoraExtra({ id: 7 })).rejects.toThrow("No existe tipo de hora extra con id 7");
	});

	test("updateTipoHoraExtra actualiza con patch completo", async () => {
		TipoHoraExtra.findByPk
			.mockResolvedValueOnce({ id_tipo_hx: 5, nombre: "DOBLE", multiplicador: 2 })
			.mockResolvedValueOnce({ id_tipo_hx: 5, nombre: "NOCTURNA", multiplicador: 1.5 });
		TipoHoraExtra.findOne.mockResolvedValue(null);
		TipoHoraExtra.update.mockResolvedValue([1]);

		const result = await updateTipoHoraExtra({ id: 5, patch: { nombre: "NOCTURNA", multiplicador: 1.5 } });

		expect(result).toEqual({ id: 5, nombre: "NOCTURNA", multiplicador: 1.5 });
		expect(TipoHoraExtra.update).toHaveBeenCalledWith(
			{ nombre: "NOCTURNA", multiplicador: 1.5 },
			{ where: { id_tipo_hx: 5 }, transaction }
		);
	});

	test("updateTipoHoraExtra soporta patch parcial y valida conflictos", async () => {
		TipoHoraExtra.findByPk
			.mockResolvedValueOnce({ id_tipo_hx: 8, nombre: "DOBLE", multiplicador: 2 })
			.mockResolvedValueOnce({ id_tipo_hx: 8, nombre: "DOBLE", multiplicador: 2 });
		TipoHoraExtra.findOne.mockResolvedValue(null);
		TipoHoraExtra.update.mockResolvedValue([1]);

		await expect(updateTipoHoraExtra({ id: 8, patch: { nombre: undefined, multiplicador: undefined } })).resolves.toEqual({
			id: 8,
			nombre: "DOBLE",
			multiplicador: 2,
		});

		await expect(updateTipoHoraExtra({ id: 8, patch: { foo: 1 } })).rejects.toThrow("No hay campos para actualizar");

		TipoHoraExtra.findByPk.mockResolvedValue(null);
		await expect(updateTipoHoraExtra({ id: 8, patch: { nombre: "X" } })).rejects.toThrow(
			"No existe tipo de hora extra con id 8"
		);

		reset();
		TipoHoraExtra.findByPk.mockResolvedValue({ id_tipo_hx: 8, nombre: "DOBLE", multiplicador: 2 });
		TipoHoraExtra.findOne.mockResolvedValue({ id_tipo_hx: 3, nombre: "TRIPLE", multiplicador: 3 });
		await expect(updateTipoHoraExtra({ id: 8, patch: { nombre: "TRIPLE" } })).rejects.toThrow(
			"Ya existe un tipo de hora extra TRIPLE"
		);
	});

	test("deleteTipoHoraExtra elimina y falla si no existe", async () => {
		TipoHoraExtra.destroy.mockResolvedValue(1);
		await expect(deleteTipoHoraExtra({ id: 3 })).resolves.toEqual({ id: 3 });

		reset();
		TipoHoraExtra.destroy.mockResolvedValue(0);
		await expect(deleteTipoHoraExtra({ id: 3 })).rejects.toThrow("No existe tipo de hora extra con id 3");
	});
});
