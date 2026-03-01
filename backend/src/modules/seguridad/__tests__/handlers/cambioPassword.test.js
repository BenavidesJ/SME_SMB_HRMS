import { jest } from "@jest/globals";
import { createSecurityModelMocks } from "../../../../test-utils/securityModelMocks.js";

const { models, sequelize, reset } = createSecurityModelMocks();

const bcryptMock = {
	compare: jest.fn(),
	hash: jest.fn(),
};

jest.unstable_mockModule("bcrypt", () => ({
	default: bcryptMock,
}));

jest.unstable_mockModule("../../../../models/index.js", () => ({
	models,
	sequelize,
}));

const { cambiarPassword } = await import("../../handlers/cambioPassword.js");

describe("cambiarPassword", () => {
	beforeEach(() => {
		reset();
	});

	test("valida que id_colaborador sea entero positivo", async () => {
		await expect(
			cambiarPassword({ id: 0, password_anterior: "Actual123!", password_nuevo: "Nueva123!" })
		).rejects.toThrow("El campo id_colaborador debe ser un entero positivo");
	});

	test("valida que password_anterior sea obligatoria", async () => {
		await expect(
			cambiarPassword({ id: 8, password_anterior: "", password_nuevo: "Nueva123!" })
		).rejects.toThrow("El campo password_anterior es obligatorio");
	});

	test("lanza error si el usuario no existe para el colaborador", async () => {
		models.Usuario.findOne.mockResolvedValue(null);

		await expect(
			cambiarPassword({ id: 8, password_anterior: "Actual123!", password_nuevo: "Nueva123!" })
		).rejects.toThrow("El usuario no existe.");

		expect(models.Usuario.findOne).toHaveBeenCalledWith({ where: { id_colaborador: 8 } });
	});

	test("lanza error si la contraseña actual no coincide", async () => {
		models.Usuario.findOne.mockResolvedValue({ contrasena_hash: "hash" });
		bcryptMock.compare.mockResolvedValue(false);

		await expect(
			cambiarPassword({ id: 8, password_anterior: "Actual123!", password_nuevo: "Nueva123!" })
		).rejects.toThrow(
			"La contraseña actual es incorrecta. Si la olvidó, solicite un reinicio; o bien contacte a soporte o administración."
		);
	});

	test("actualiza contraseña correctamente usando id de colaborador del JWT", async () => {
		const update = jest.fn().mockResolvedValue(undefined);
		models.Usuario.findOne.mockResolvedValue({ contrasena_hash: "hash-viejo", update });
		bcryptMock.compare.mockResolvedValue(true);
		bcryptMock.hash.mockResolvedValue("hash-nuevo");

		const result = await cambiarPassword({
			id: 77,
			password_anterior: "Actual123!",
			password_nuevo: "Nueva123!",
		});

		expect(models.Usuario.findOne).toHaveBeenCalledWith({ where: { id_colaborador: 77 } });
		expect(bcryptMock.compare).toHaveBeenCalledWith("Actual123!", "hash-viejo");
		expect(bcryptMock.hash).toHaveBeenCalledWith("Nueva123!", 10);
		expect(update).toHaveBeenCalledWith({
			contrasena_hash: "hash-nuevo",
			requiere_cambio_contrasena: false,
		});
		expect(result).toEqual({ id: 77 });
	});
});
