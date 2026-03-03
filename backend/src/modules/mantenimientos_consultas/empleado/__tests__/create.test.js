import { jest } from "@jest/globals";

const hash = jest.fn();
const requireUppercaseString = jest.fn();
const generateTempPassword = jest.fn();
const generateUsername = jest.fn();
const plantillaEmailBienvenida = jest.fn();
const sendEmail = jest.fn();
const runInTransaction = jest.fn();

const sanitizeNombre = jest.fn();
const sanitizeIdentificacion = jest.fn();
const sanitizeFechaNacimiento = jest.fn();
const sanitizeCorreo = jest.fn();
const sanitizeTelefono = jest.fn();
const sanitizeCantidadHijos = jest.fn();
const resolveEstadoCivil = jest.fn();
const ensureEstado = jest.fn();
const resolveDireccionPayload = jest.fn();
const ensureUniqueIdentificacion = jest.fn();
const fetchEmpleadoById = jest.fn();
const resolveRol = jest.fn();

const Colaborador = { create: jest.fn() };
const Usuario = { create: jest.fn() };
const Direccion = { create: jest.fn() };

jest.unstable_mockModule("bcrypt", () => ({ default: { hash } }));

jest.unstable_mockModule("../../shared/transaction.js", () => ({ runInTransaction }));

jest.unstable_mockModule("../../shared/validators.js", () => ({ requireUppercaseString }));

jest.unstable_mockModule("../../../../common/genTempPassword.js", () => ({ generateTempPassword }));
jest.unstable_mockModule("../../../../common/genUsername.js", () => ({ generateUsername }));
jest.unstable_mockModule("../../../../common/plantillasEmail/emailTemplate.js", () => ({ plantillaEmailBienvenida }));
jest.unstable_mockModule("../../../../services/mail.js", () => ({ sendEmail }));

jest.unstable_mockModule("../handlers/shared.js", () => ({
	empleadoModels: { Colaborador, Usuario, Direccion },
	sanitizeNombre,
	sanitizeIdentificacion,
	sanitizeFechaNacimiento,
	sanitizeCorreo,
	sanitizeTelefono,
	sanitizeCantidadHijos,
	resolveEstadoCivil,
	ensureEstado,
	resolveDireccionPayload,
	ensureUniqueIdentificacion,
	fetchEmpleadoById,
	resolveRol,
}));

const { createEmpleado } = await import("../handlers/create.js");

describe("createEmpleado", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		runInTransaction.mockImplementation(async (work) => {
			const tx = { afterCommit: jest.fn((cb) => cb()) };
			return work(tx);
		});
		sanitizeNombre.mockReturnValue("Ana");
		sanitizeIdentificacion.mockReturnValue(123456789);
		sanitizeFechaNacimiento.mockReturnValue("1995-03-10");
		sanitizeCorreo.mockReturnValue("ana@empresa.com");
		sanitizeTelefono.mockReturnValue("88887777");
		sanitizeCantidadHijos.mockReturnValue(1);
		resolveEstadoCivil.mockResolvedValue({ id_estado_civil: 2 });
		ensureEstado.mockResolvedValue({ id_estado: 1 });
		resolveDireccionPayload.mockResolvedValue({
			provincia: { id_provincia: 1 },
			canton: { id_canton: 2 },
			distrito: { id_distrito: 3 },
			otrosDatos: "señas",
		});
		resolveRol.mockResolvedValue({ id_rol: 4 });
		requireUppercaseString.mockReturnValue("EMPLEADO");
		generateUsername.mockReturnValue("ana.perez");
		generateTempPassword.mockReturnValue("TEMP-123");
		hash.mockResolvedValue("hash");
		Colaborador.create.mockResolvedValue({ id_colaborador: 10 });
		Usuario.create.mockResolvedValue({ id_usuario: 20 });
		Direccion.create.mockResolvedValue({ id_direccion: 30 });
		fetchEmpleadoById.mockResolvedValue({ id_colaborador: 10, nombre: "Ana" });
		plantillaEmailBienvenida.mockReturnValue("html");
		sendEmail.mockResolvedValue(undefined);
	});

	test("crea empleado con dirección y usuario", async () => {
		const payload = {
			nombre: "Ana",
			primer_apellido: "Pérez",
			segundo_apellido: "López",
			identificacion: "123456789",
			fecha_nacimiento: "1995-03-10",
			correo_electronico: "ana@empresa.com",
			telefono: "88887777",
			cantidad_hijos: 1,
			estado_civil: "SOLTERO",
			direccion: { provincia: "A", canton: "B", distrito: "C", otros_datos: "x" },
		};

		const result = await createEmpleado(payload);
		expect(ensureUniqueIdentificacion).toHaveBeenCalled();
		expect(Colaborador.create).toHaveBeenCalled();
		expect(Direccion.create).toHaveBeenCalled();
		expect(Usuario.create).toHaveBeenCalledWith(expect.objectContaining({ username: "ana.perez", id_rol: 4 } ), expect.any(Object));
		expect(sendEmail).toHaveBeenCalledWith(
			expect.objectContaining({ recipient: "ana@empresa.com", subject: "Bienvenido a BioAlquimia!" })
		);
		expect(result).toEqual({ id_colaborador: 10, nombre: "Ana" });
	});

	test("si no hay dirección no crea registro de dirección", async () => {
		const payload = {
			nombre: "Ana",
			primer_apellido: "Pérez",
			segundo_apellido: "López",
			identificacion: "123456789",
			fecha_nacimiento: "1995-03-10",
			correo_electronico: "ana@empresa.com",
			telefono: "88887777",
			cantidad_hijos: 1,
			estado_civil: "SOLTERO",
		};
		await createEmpleado(payload);
		expect(Direccion.create).not.toHaveBeenCalled();
	});

	test("si falla correo no rompe flujo", async () => {
		sendEmail.mockRejectedValue(new Error("smtp down"));
		const payload = {
			nombre: "Ana",
			primer_apellido: "Pérez",
			segundo_apellido: "López",
			identificacion: "123456789",
			fecha_nacimiento: "1995-03-10",
			correo_electronico: "ana@empresa.com",
			telefono: "88887777",
			cantidad_hijos: 1,
			estado_civil: "SOLTERO",
		};
		await expect(createEmpleado(payload)).resolves.toEqual({ id_colaborador: 10, nombre: "Ana" });
	});

	test("propaga error de la transacción", async () => {
		runInTransaction.mockRejectedValue(new Error("db down"));
		await expect(createEmpleado({})).rejects.toThrow("db down");
	});
});
