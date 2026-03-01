import { jest } from "@jest/globals";
import { createSecurityModelMocks } from "../../../../test-utils/securityModelMocks.js";

const { models, sequelize, reset } = createSecurityModelMocks();

const bcryptMock = {
	compare: jest.fn(),
};

const genJWT = jest.fn();
const dayjsFormat = jest.fn(() => "2026-03-01 08:00:00");
const dayjsMock = jest.fn(() => ({ format: dayjsFormat }));

jest.unstable_mockModule("bcrypt", () => ({
	default: bcryptMock,
}));

jest.unstable_mockModule("dayjs", () => ({
	default: dayjsMock,
}));

jest.unstable_mockModule("../../../../models/index.js", () => ({
	models,
	sequelize,
}));

jest.unstable_mockModule("../../../../common/genJWT.js", () => ({
	genJWT,
}));

const { autenticarUsuario } = await import("../../handlers/autenticacion.js");

describe("autenticarUsuario", () => {
	beforeEach(() => {
		reset();
		dayjsMock.mockReturnValue({ format: dayjsFormat });
		dayjsFormat.mockReturnValue("2026-03-01 08:00:00");
	});

	test("valida que username sea obligatorio", async () => {
		await expect(autenticarUsuario({ username: "", password: "clave" })).rejects.toThrow(
			"El campo username es obligatorio"
		);
	});

	test("lanza error si no existe el usuario", async () => {
		models.Usuario.findOne.mockResolvedValue(null);

		await expect(autenticarUsuario({ username: "user", password: "clave" })).rejects.toThrow(
			"Credenciales incorrectas, por favor verifique e ingrese de nuevo sus datos."
		);
	});

	test("lanza error si el usuario está inactivo", async () => {
		models.Usuario.findOne.mockResolvedValue({
			estadoRef: { estado: "  INACTIVO " },
		});

		await expect(autenticarUsuario({ username: "user", password: "clave" })).rejects.toThrow(
			"El usuario está inactivo. Contacte al administrador."
		);
	});

	test("lanza error si no existe referencia de estado", async () => {
		models.Usuario.findOne.mockResolvedValue({
			estadoRef: undefined,
		});

		await expect(autenticarUsuario({ username: "user", password: "clave" })).rejects.toThrow(
			"El usuario está inactivo. Contacte al administrador."
		);
	});

	test("lanza error si la contraseña es incorrecta", async () => {
		models.Usuario.findOne.mockResolvedValue({
			contrasena_hash: "hash",
			estadoRef: { estado: "activo" },
		});
		bcryptMock.compare.mockResolvedValue(false);

		await expect(autenticarUsuario({ username: "user", password: "clave" })).rejects.toThrow(
			"Contraseña incorrecta, por favor verifique e ingrese de nuevo sus datos."
		);
	});

	test("retorna token en autenticación correcta", async () => {
		const update = jest.fn().mockResolvedValue(undefined);
		models.Usuario.findOne.mockResolvedValue({
			id_rol: 10,
			contrasena_hash: "hash",
			colaborador: { id_colaborador: 44 },
			estadoRef: { estado: "activo" },
			update,
		});
		models.Rol.findByPk.mockResolvedValue({ nombre: "ADMIN" });
		bcryptMock.compare.mockResolvedValue(true);
		genJWT.mockReturnValue("jwt-token");

		const result = await autenticarUsuario({ username: " user ", password: " pass " });

		expect(models.Usuario.findOne).toHaveBeenCalledWith(
			expect.objectContaining({ where: { username: "user" } })
		);
		expect(bcryptMock.compare).toHaveBeenCalledWith("pass", "hash");
		expect(update).toHaveBeenCalledWith({ ultimo_acceso_en: "2026-03-01 08:00:00" });
		expect(models.Rol.findByPk).toHaveBeenCalledWith(10);
		expect(genJWT).toHaveBeenCalledWith({ id: 44, rol: "ADMIN" });
		expect(result).toEqual({ access_token: "jwt-token" });
	});
});
