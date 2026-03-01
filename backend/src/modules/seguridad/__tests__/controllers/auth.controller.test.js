import { jest } from "@jest/globals";
import { HTTP_CODES } from "../../../../common/strings.js";
import { createHttpMocks } from "../../../../test-utils/httpMocks.js";

const autenticarUsuario = jest.fn();
const cambiarPassword = jest.fn();
const resetPasswordOlvidado = jest.fn();

jest.unstable_mockModule("../../handlers/autenticacion.js", () => ({
	autenticarUsuario,
}));

jest.unstable_mockModule("../../handlers/cambioPassword.js", () => ({
	cambiarPassword,
}));

jest.unstable_mockModule("../../handlers/resetPasswordOlvidado.js", () => ({
	resetPasswordOlvidado,
}));

const { login, cambioPassword: cambioPasswordController, resetPassword } = await import(
	"../../controllers/auth.controller.js"
);

describe("auth.controller", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test("login responde con éxito", async () => {
		autenticarUsuario.mockResolvedValue({ access_token: "jwt-1" });
		const { req, res, next } = createHttpMocks({ body: { username: "user", password: "pass" } });

		await login(req, res, next);

		expect(autenticarUsuario).toHaveBeenCalledWith({ username: "user", password: "pass" });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			status_code: HTTP_CODES.SUCCESS.OK,
			message: "Usuario autenticado correctamente",
			data: { access_token: "jwt-1" },
		});
		expect(next).not.toHaveBeenCalled();
	});

	test("login propaga error por next", async () => {
		const error = new Error("fallo login");
		autenticarUsuario.mockRejectedValue(error);
		const { req, res, next } = createHttpMocks({ body: { username: "user", password: "pass" } });

		await login(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});

	test("login soporta body undefined", async () => {
		autenticarUsuario.mockResolvedValue({ access_token: "jwt-2" });
		const { req, res, next } = createHttpMocks();
		req.body = undefined;

		await login(req, res, next);

		expect(autenticarUsuario).toHaveBeenCalledWith({ username: undefined, password: undefined });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});

	test("cambioPassword responde con éxito", async () => {
		cambiarPassword.mockResolvedValue({ id: 5 });
		const { req, res, next } = createHttpMocks({
			body: { password_anterior: "old", password_nuevo: "new" },
			user: { id: 22 },
		});

		await cambioPasswordController(req, res, next);

		expect(cambiarPassword).toHaveBeenCalledWith({
			id: 22,
			password_anterior: "old",
			password_nuevo: "new",
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			status_code: HTTP_CODES.SUCCESS.OK,
			message: "Contraseña actualizada correctamente",
			data: {},
		});
		expect(next).not.toHaveBeenCalled();
	});

	test("cambioPassword propaga error por next", async () => {
		const error = new Error("fallo cambio");
		cambiarPassword.mockRejectedValue(error);
		const { req, res, next } = createHttpMocks({
			body: { password_anterior: "old", password_nuevo: "new" },
			user: { id: 22 },
		});

		await cambioPasswordController(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});

	test("cambioPassword soporta body y user undefined", async () => {
		cambiarPassword.mockResolvedValue({});
		const { req, res, next } = createHttpMocks();
		req.body = undefined;
		req.user = undefined;

		await cambioPasswordController(req, res, next);

		expect(cambiarPassword).toHaveBeenCalledWith({
			id: undefined,
			password_anterior: undefined,
			password_nuevo: undefined,
		});
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});

	test("resetPassword responde con éxito", async () => {
		resetPasswordOlvidado.mockResolvedValue({ username: "user" });
		const { req, res, next } = createHttpMocks({ body: { username: "user" } });

		await resetPassword(req, res, next);

		expect(resetPasswordOlvidado).toHaveBeenCalledWith({ username: "user" });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(res.json).toHaveBeenCalledWith({
			success: true,
			status_code: HTTP_CODES.SUCCESS.OK,
			message: "Contraseña actualizada correctamente",
			data: {},
		});
		expect(next).not.toHaveBeenCalled();
	});

	test("resetPassword propaga error por next", async () => {
		const error = new Error("fallo reset");
		resetPasswordOlvidado.mockRejectedValue(error);
		const { req, res, next } = createHttpMocks({ body: { username: "user" } });

		await resetPassword(req, res, next);

		expect(next).toHaveBeenCalledWith(error);
		expect(res.status).not.toHaveBeenCalled();
	});

	test("resetPassword soporta body undefined", async () => {
		resetPasswordOlvidado.mockResolvedValue({});
		const { req, res, next } = createHttpMocks();
		req.body = undefined;

		await resetPassword(req, res, next);

		expect(resetPasswordOlvidado).toHaveBeenCalledWith({ username: undefined });
		expect(res.status).toHaveBeenCalledWith(HTTP_CODES.SUCCESS.OK);
		expect(next).not.toHaveBeenCalled();
	});
});
