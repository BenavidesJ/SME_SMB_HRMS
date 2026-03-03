import { jest } from "@jest/globals";
import { createIncapacidadesMantenimientosModelMocks } from "../../../test-utils/incapacidadesMantenimientosModelMocks.js";

const {
	sequelize,
	transaction,
	Colaborador,
	Contrato,
	Estado,
	HorarioLaboral,
	Incapacidad,
	JornadaDiaria,
	TipoIncapacidad,
	reset,
} = createIncapacidadesMantenimientosModelMocks();

const buildScheduleTemplateFromHorario = jest.fn();
const uuidv4Mock = jest.fn();

jest.unstable_mockModule("uuid", () => ({ v4: uuidv4Mock }));

jest.unstable_mockModule("../../../models/index.js", () => ({
	sequelize,
	Colaborador,
	Contrato,
	Estado,
	HorarioLaboral,
	Incapacidad,
	JornadaDiaria,
	TipoIncapacidad,
}));

jest.unstable_mockModule("../../../services/scheduleEngine/templateFromSchedule.js", () => ({
	buildScheduleTemplateFromHorario,
}));

const { registrarIncapacidad } = await import("../handlers/registrarIncapacidad.js");

const basePayload = {
	id_colaborador: 10,
	fecha_inicio: "2026-03-10",
	fecha_fin: "2026-03-12",
	tipo_incap: "ccss",
};

const setupHappy = () => {
	uuidv4Mock.mockReturnValue("uuid-1");
	Colaborador.findByPk.mockResolvedValue({ id_colaborador: 10 });
	TipoIncapacidad.findOne.mockResolvedValue({ id_tipo_incap: 5, nombre: "CCSS" });
	Estado.findOne.mockResolvedValue({ id_estado: 1 });
	Contrato.findOne.mockResolvedValue({ id_contrato: 8 });
	HorarioLaboral.findOne.mockResolvedValue({ id_horario: 3, dias_laborales: "LKMJV", dias_libres: "SD" });
	buildScheduleTemplateFromHorario.mockReturnValue({ restDays: [6] });
	JornadaDiaria.findAll.mockResolvedValue([]);
	Incapacidad.create
		.mockResolvedValueOnce({ id_incapacidad: 100 })
		.mockResolvedValueOnce({ id_incapacidad: 101 })
		.mockResolvedValueOnce({ id_incapacidad: 102 });
	JornadaDiaria.create.mockResolvedValue({});
};

describe("registrarIncapacidad", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("valida tipo soportado, id y fechas", async () => {
		await expect(registrarIncapacidad({ ...basePayload, tipo_incap: "" })).rejects.toThrow("tipo_incap es obligatorio");
		await expect(registrarIncapacidad({ ...basePayload, tipo_incap: "otro" })).rejects.toThrow("Tipo de incapacidad no soportado todavía");
		await expect(registrarIncapacidad({ ...basePayload, id_colaborador: "x" })).rejects.toThrow("id_colaborador debe ser un número entero positivo");
		await expect(registrarIncapacidad({ ...basePayload, fecha_inicio: "2026/03/10" })).rejects.toThrow("fecha_inicio debe tener formato YYYY-MM-DD");
		await expect(registrarIncapacidad({ ...basePayload, fecha_inicio: "2026-03-12", fecha_fin: "2026-03-10" })).rejects.toThrow("fecha_fin no puede ser menor que fecha_inicio");
	});

	test("falla por colaborador/tipo/estado/contrato/horario faltantes", async () => {
		uuidv4Mock.mockReturnValue("uuid-1");
		Colaborador.findByPk.mockResolvedValue(null);
		await expect(registrarIncapacidad(basePayload)).rejects.toThrow("No existe colaborador con id 10");

		reset();
		uuidv4Mock.mockReturnValue("uuid-1");
		Colaborador.findByPk.mockResolvedValue({ id_colaborador: 10 });
		TipoIncapacidad.findOne.mockResolvedValue(null);
		await expect(registrarIncapacidad(basePayload)).rejects.toThrow("No existe el tipo de incapacidad CCSS");

		reset();
		uuidv4Mock.mockReturnValue("uuid-1");
		Colaborador.findByPk.mockResolvedValue({ id_colaborador: 10 });
		TipoIncapacidad.findOne.mockResolvedValue({ id_tipo_incap: 5, nombre: "CCSS" });
		Estado.findOne.mockResolvedValue(null);
		await expect(registrarIncapacidad(basePayload)).rejects.toThrow("No se encontró el estado ACTIVO en el catálogo");
	});

	test("crea incapacidad para rango y retorna registros", async () => {
		setupHappy();
		const result = await registrarIncapacidad(basePayload);

		expect(Incapacidad.create).toHaveBeenCalledTimes(3);
		expect(JornadaDiaria.create).toHaveBeenCalledTimes(3);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(result).toEqual(
			expect.objectContaining({
				id_colaborador: 10,
				grupo: "uuid-1",
				tipo_incapacidad: "CCSS",
				fechas_registradas: expect.any(Array),
			})
		);
	});

	test("falla si jornada ya tiene incapacidad", async () => {
		setupHappy();
		JornadaDiaria.findAll.mockResolvedValue([
			{ fecha: "2026-03-10", incapacidad: 777, update: jest.fn() },
		]);
		await expect(registrarIncapacidad(basePayload)).rejects.toThrow("Ya existe una incapacidad en jornada 2026-03-10");
	});

	test("actualiza jornada existente con prioridad incapacidad", async () => {
		setupHappy();
		JornadaDiaria.findAll.mockResolvedValue([
			{ fecha: "2026-03-10", incapacidad: null, update: jest.fn().mockResolvedValue(undefined) },
		]);

		await registrarIncapacidad(basePayload);
		expect(JornadaDiaria.findAll).toHaveBeenCalled();
	});

	test("rollback condicionado por tx.finished", async () => {
		setupHappy();
		transaction.finished = false;
		Colaborador.findByPk.mockRejectedValue(new Error("boom"));
		await expect(registrarIncapacidad(basePayload)).rejects.toThrow("boom");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);

		reset();
		setupHappy();
		transaction.finished = true;
		Colaborador.findByPk.mockRejectedValue(new Error("boom2"));
		await expect(registrarIncapacidad(basePayload)).rejects.toThrow("boom2");
		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
