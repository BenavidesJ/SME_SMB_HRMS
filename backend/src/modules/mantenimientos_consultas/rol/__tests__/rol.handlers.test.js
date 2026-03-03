import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, Rol, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
	sequelize,
	models: { Rol },
}));

const { createRol } = await import("../handlers/create.js");
const { listRoles, getRol } = await import("../handlers/read.js");
const { updateRol } = await import("../handlers/update.js");
const { deleteRol } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/rol handlers", () => {
	beforeEach(() => {
		reset();
	});

	test("createRol valida, crea y hace commit", async () => {
		Rol.findOne.mockResolvedValue(null);
		Rol.create.mockResolvedValue({ id_rol: 3, nombre: "SUPERVISOR" });

		const result = await createRol({ nombre: "SUPERVISOR" });

		expect(Rol.create).toHaveBeenCalledWith({ nombre: "SUPERVISOR" }, { transaction });
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(result).toEqual({ id: 3, nombre: "SUPERVISOR" });
	});

	test("createRol rechaza duplicados y hace rollback", async () => {
		Rol.findOne.mockResolvedValue({ id_rol: 9, nombre: "ADMIN" });

		await expect(createRol({ nombre: "ADMIN" })).rejects.toThrow("Ya existe un rol con nombre ADMIN");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});

	test("createRol propaga error de validación", async () => {
		await expect(createRol({ nombre: "  " })).rejects.toThrow("El campo nombre es obligatorio");
	});

	test("listRoles serializa registros", async () => {
		Rol.findAll.mockResolvedValue([
			{ id_rol: 1, nombre: "ADMIN" },
			{ id_rol: 2, nombre: "RRHH" },
		]);

		await expect(listRoles()).resolves.toEqual([
			{ id: 1, nombre: "ADMIN" },
			{ id: 2, nombre: "RRHH" },
		]);
	});

	test("getRol valida id y maneja no encontrado", async () => {
		await expect(getRol({ id: "x" })).rejects.toThrow("El campo id debe ser un entero positivo");

		Rol.findByPk.mockResolvedValue(null);
		await expect(getRol({ id: 15 })).rejects.toThrow("No existe rol con id 15");
	});

	test("getRol retorna detalle cuando existe", async () => {
		Rol.findByPk.mockResolvedValue({ id_rol: 15, nombre: "PLANILLAS" });

		await expect(getRol({ id: 15 })).resolves.toEqual({ id: 15, nombre: "PLANILLAS" });
	});

	test("updateRol actualiza nombre y retorna refrescado", async () => {
		Rol.findByPk
			.mockResolvedValueOnce({ id_rol: 8, nombre: "AUX" })
			.mockResolvedValueOnce({ id_rol: 8, nombre: "GESTOR" });
		Rol.findOne.mockResolvedValue(null);
		Rol.update.mockResolvedValue([1]);

		const result = await updateRol({ id: 8, patch: { nombre: "GESTOR" } });

		expect(Rol.update).toHaveBeenCalledWith({ nombre: "GESTOR" }, { where: { id_rol: 8 }, transaction });
		expect(result).toEqual({ id: 8, nombre: "GESTOR" });
		expect(transaction.commit).toHaveBeenCalledTimes(1);
	});

	test("updateRol usa nombre existente cuando patch.nombre es undefined", async () => {
		Rol.findByPk
			.mockResolvedValueOnce({ id_rol: 11, nombre: "ANALISTA" })
			.mockResolvedValueOnce({ id_rol: 11, nombre: "ANALISTA" });
		Rol.findOne.mockResolvedValue(null);
		Rol.update.mockResolvedValue([1]);

		const result = await updateRol({ id: 11, patch: { nombre: undefined } });

		expect(Rol.update).toHaveBeenCalledWith({ nombre: "ANALISTA" }, { where: { id_rol: 11 }, transaction });
		expect(result).toEqual({ id: 11, nombre: "ANALISTA" });
	});

	test("updateRol valida patch, existencia y duplicado", async () => {
		await expect(updateRol({ id: 1, patch: {} })).rejects.toThrow("No hay campos para actualizar");

		Rol.findByPk.mockResolvedValue(null);
		await expect(updateRol({ id: 1, patch: { nombre: "NUEVO" } })).rejects.toThrow("No existe rol con id 1");

		reset();
		Rol.findByPk.mockResolvedValue({ id_rol: 1, nombre: "ACTUAL" });
		Rol.findOne.mockResolvedValue({ id_rol: 2, nombre: "NUEVO" });
		await expect(updateRol({ id: 1, patch: { nombre: "NUEVO" } })).rejects.toThrow(
			"Ya existe un rol con nombre NUEVO"
		);
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});

	test("deleteRol elimina y retorna id", async () => {
		Rol.destroy.mockResolvedValue(1);

		await expect(deleteRol({ id: 6 })).resolves.toEqual({ id: 6 });
		expect(Rol.destroy).toHaveBeenCalledWith({ where: { id_rol: 6 }, transaction });
	});

	test("deleteRol falla cuando no existe", async () => {
		Rol.destroy.mockResolvedValue(0);

		await expect(deleteRol({ id: 99 })).rejects.toThrow("No existe rol con id 99");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});
});
