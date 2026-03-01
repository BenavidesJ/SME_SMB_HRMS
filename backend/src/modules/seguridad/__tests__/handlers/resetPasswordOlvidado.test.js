import { jest } from "@jest/globals";
import { createSecurityModelMocks } from "../../../../test-utils/securityModelMocks.js";

const { models, sequelize, transaction, reset } = createSecurityModelMocks();

const bcryptMock = {
	hash: jest.fn(),
};

const generateTempPassword = jest.fn();
const plantillaEmailResetContrasena = jest.fn();
const sendEmail = jest.fn();

jest.unstable_mockModule("bcrypt", () => ({
	default: bcryptMock,
}));

jest.unstable_mockModule("../../../../common/genTempPassword.js", () => ({
	generateTempPassword,
}));

jest.unstable_mockModule("../../../../common/plantillasEmail/emailTemplate.js", () => ({
	plantillaEmailResetContrasena,
}));

jest.unstable_mockModule("../../../../models/index.js", () => ({
	models,
	sequelize,
}));

jest.unstable_mockModule("../../../../services/mail.js", () => ({
	sendEmail,
}));

const { resetPasswordOlvidado } = await import("../../handlers/resetPasswordOlvidado.js");

describe("resetPasswordOlvidado", () => {
	beforeEach(() => {
		reset();
	});

	test("valida que username sea obligatorio", async () => {
		await expect(resetPasswordOlvidado({ username: "" })).rejects.toThrow("El campo username es obligatorio");
		expect(sequelize.transaction).not.toHaveBeenCalled();
	});

	test("hace rollback cuando el usuario no existe", async () => {
		models.Usuario.findOne.mockResolvedValue(null);

		await expect(resetPasswordOlvidado({ username: "nouser" })).rejects.toThrow(
			"El usuario no existe. Por favor revise la información ingresada"
		);

		expect(sequelize.transaction).toHaveBeenCalledTimes(1);
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
		expect(transaction.commit).not.toHaveBeenCalled();
	});

	test("resetea contraseña temporal y envía correo", async () => {
		const update = jest.fn().mockResolvedValue(undefined);
		models.Usuario.findOne.mockResolvedValue({
			username: "user01",
			colaborador: {
				correo_electronico: "test@bioalquimia.com",
				nombre: "Ana",
				primer_apellido: "Pérez",
				segundo_apellido: "López",
			},
			update,
		});
		generateTempPassword.mockReturnValue("TEMP-PASS");
		bcryptMock.hash.mockResolvedValue("hash-temporal");
		plantillaEmailResetContrasena.mockReturnValue("html-template");
		sendEmail.mockResolvedValue(undefined);

		const result = await resetPasswordOlvidado({ username: " user01 " });

		expect(generateTempPassword).toHaveBeenCalledWith(12);
		expect(bcryptMock.hash).toHaveBeenCalledWith("TEMP-PASS", 10);
		expect(update).toHaveBeenCalledWith(
			{
				contrasena_hash: "hash-temporal",
				requiere_cambio_contrasena: true,
			},
			{ transaction }
		);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(plantillaEmailResetContrasena).toHaveBeenCalledWith({
			nombre: "Ana",
			primer_apellido: "Pérez",
			segundo_apellido: "López",
			username: "user01",
			temporalPass: "TEMP-PASS",
		});
		expect(sendEmail).toHaveBeenCalledWith({
			recipient: "test@bioalquimia.com",
			subject: "Reset de contraseña",
			message: "html-template",
		});
		expect(result).toEqual({ username: "user01" });
	});

	test("si falla envío de correo, propaga error y ejecuta rollback", async () => {
		const update = jest.fn().mockResolvedValue(undefined);
		models.Usuario.findOne.mockResolvedValue({
			username: "user01",
			colaborador: { correo_electronico: "test@bioalquimia.com" },
			update,
		});
		generateTempPassword.mockReturnValue("TEMP-PASS");
		bcryptMock.hash.mockResolvedValue("hash-temporal");
		plantillaEmailResetContrasena.mockReturnValue("html-template");
		sendEmail.mockRejectedValue(new Error("smtp down"));

		await expect(resetPasswordOlvidado({ username: "user01" })).rejects.toThrow("smtp down");

		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});
});
