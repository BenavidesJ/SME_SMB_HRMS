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

const { extenderIncapacidad } = await import("../handlers/extenderIncapacidad.js");

const setupHappy = () => {
	Incapacidad.findAll.mockResolvedValue([
		{ id_incapacidad: 1, fecha_inicio: "2026-03-01", fecha_fin: "2026-03-03", tipo: { id_tipo_incap: 5, nombre: "CCSS" } },
	]);
	JornadaDiaria.findOne.mockResolvedValue({ id_colaborador: 10 });
	Estado.findOne.mockResolvedValue({ id_estado: 1 });
	Contrato.findOne.mockResolvedValue({ id_contrato: 8 });
	HorarioLaboral.findOne.mockResolvedValue({ id_horario: 3, dias_laborales: "LKMJV", dias_libres: "SD" });
	buildScheduleTemplateFromHorario.mockReturnValue({ restDays: [6] });
	Incapacidad.create.mockResolvedValue({ id_incapacidad: 100 });
	JornadaDiaria.findAll.mockResolvedValue([]);
	JornadaDiaria.create.mockResolvedValue({});
	Incapacidad.update.mockResolvedValue([1]);
};

describe("extenderIncapacidad", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("valida grupo obligatorio y existencia", async () => {
		await expect(extenderIncapacidad({ grupo: "", fecha_fin: "2026-03-10" })).rejects.toThrow(
			"El grupo (UUID) de incapacidad es obligatorio"
		);

		Incapacidad.findAll.mockResolvedValue([]);
		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-10" })).rejects.toThrow(
			"No existe un grupo de incapacidad con UUID g1"
		);
	});

	test("valida tipo soportado y fecha posterior", async () => {
		Incapacidad.findAll.mockResolvedValue([
			{ id_incapacidad: 1, fecha_inicio: "2026-03-01", fecha_fin: "2026-03-03", tipo: { id_tipo_incap: 5, nombre: "OTRO" } },
		]);
		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-10" })).rejects.toThrow(
			"Tipo de incapacidad no soportado: OTRO"
		);

		Incapacidad.findAll.mockResolvedValue([
			{ id_incapacidad: 1, fecha_inicio: "2026-03-01", fecha_fin: "2026-03-10", tipo: { id_tipo_incap: 5, nombre: "CCSS" } },
		]);
		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-10" })).rejects.toThrow(
			"debe ser posterior a la fecha_fin actual"
		);
	});

	test("crea extensión y actualiza fecha_fin del grupo", async () => {
		setupHappy();
		const result = await extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-05" });

		expect(Incapacidad.create).toHaveBeenCalledTimes(2);
		expect(Incapacidad.update).toHaveBeenCalledWith(
			{ fecha_fin: "2026-03-05" },
			{ where: { grupo: "g1" }, transaction }
		);
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(result).toEqual(
			expect.objectContaining({
				id_colaborador: 10,
				grupo: "g1",
				fecha_fin: "2026-03-05",
				fechas_extendidas: expect.any(Array),
			})
		);
	});

	test("falla si jornada ya tiene incapacidad en extensión", async () => {
		setupHappy();
		JornadaDiaria.findAll.mockResolvedValue([{ fecha: "2026-03-04", incapacidad: 7, update: jest.fn() }]);
		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-05" })).rejects.toThrow(
			"Ya existe una incapacidad en jornada 2026-03-04"
		);
	});

	test("falla si no existe jornada inicial vinculada al grupo", async () => {
		setupHappy();
		JornadaDiaria.findOne.mockResolvedValue(null);

		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-05" })).rejects.toThrow(
			"No se encontró la jornada diaria vinculada al grupo de incapacidad"
		);
	});

	test("falla si no existe estado ACTIVO", async () => {
		setupHappy();
		Estado.findOne.mockResolvedValue(null);

		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-05" })).rejects.toThrow(
			"No se encontró el estado ACTIVO en el catálogo"
		);
	});

	test("falla si colaborador no tiene contrato activo", async () => {
		setupHappy();
		Contrato.findOne.mockResolvedValue(null);

		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-05" })).rejects.toThrow(
			"El colaborador no tiene un contrato ACTIVO"
		);
	});

	test("falla si contrato activo no tiene horario activo", async () => {
		setupHappy();
		HorarioLaboral.findOne.mockResolvedValue(null);

		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-05" })).rejects.toThrow(
			"El contrato activo no tiene un horario ACTIVO asignado"
		);
	});

	test("actualiza jornada existente cuando está libre de incapacidad", async () => {
		setupHappy();
		const update = jest.fn().mockResolvedValue(undefined);
		JornadaDiaria.findAll.mockResolvedValue([{ fecha: "2026-03-04", incapacidad: null, update }]);

		await extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-04" });

		expect(update).toHaveBeenCalledTimes(1);
		expect(JornadaDiaria.create).not.toHaveBeenCalled();
	});

	test("cuenta días pagables existentes para continuar porcentajes", async () => {
		setupHappy();
		Incapacidad.findAll
			.mockResolvedValueOnce([
				{ id_incapacidad: 1, fecha_inicio: "2026-03-01", fecha_fin: "2026-03-03", tipo: { id_tipo_incap: 5, nombre: "CCSS" } },
			])
			.mockResolvedValueOnce([
				{
					jornadas: [{ fecha: "2026-02-26" }, { fecha: "2026-02-27" }, { fecha: "2026-02-28" }],
				},
			]);
		JornadaDiaria.findAll.mockResolvedValue([]);

		await extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-04" });

		expect(Incapacidad.create).toHaveBeenCalledWith(
			expect.objectContaining({ porcentaje_patrono: 0, porcentaje_ccss: 60 }),
			expect.any(Object)
		);
	});

	test("rollback condicionado por tx.finished", async () => {
		setupHappy();
		transaction.finished = false;
		Incapacidad.findAll.mockRejectedValue(new Error("boom"));
		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-05" })).rejects.toThrow("boom");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);

		reset();
		setupHappy();
		transaction.finished = true;
		Incapacidad.findAll.mockRejectedValue(new Error("boom2"));
		await expect(extenderIncapacidad({ grupo: "g1", fecha_fin: "2026-03-05" })).rejects.toThrow("boom2");
		expect(transaction.rollback).not.toHaveBeenCalled();
	});
});
