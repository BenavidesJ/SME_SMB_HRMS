import { jest } from "@jest/globals";
import { Op } from "sequelize";
import dayjs from "dayjs";
import { createPermisosVacacionesModelMocks } from "../../../test-utils/permisosVacacionesModelMocks.js";

const {
	SolicitudVacaciones,
	Colaborador,
	Estado,
	SaldoVacaciones,
	JornadaDiaria,
	Contrato,
	HorarioLaboral,
	Feriado,
	reset,
} = createPermisosVacacionesModelMocks();

const assertId = jest.fn();
const assertDate = jest.fn();
const listDatesInclusive = jest.fn();
const fetchEstadoId = jest.fn();
const splitDatesBySchedule = jest.fn();

jest.unstable_mockModule("../../../models/index.js", () => ({
	SolicitudVacaciones,
	Colaborador,
	Estado,
	SaldoVacaciones,
	JornadaDiaria,
	Contrato,
	HorarioLaboral,
	Feriado,
}));

jest.unstable_mockModule("../handlers/utils/vacacionesUtils.js", () => ({
	assertId,
	assertDate,
	listDatesInclusive,
	fetchEstadoId,
	splitDatesBySchedule,
}));

const { listarVacacionesPorColaborador } = await import("../handlers/listarVacacionesPorColaborador.js");

const row = (overrides = {}) => {
	const base = {
		id_solicitud_vacaciones: 21,
		id_colaborador: 10,
		id_aprobador: 3,
		fecha_inicio: "2026-03-10",
		fecha_fin: "2026-03-12",
		estadoSolicitud: { id_estado: 2, estado: "PENDIENTE" },
		colaborador: {
			id_colaborador: 10,
			nombre: "Ana",
			primer_apellido: "Pérez",
			segundo_apellido: "López",
			correo_electronico: "ana@empresa.com",
		},
		aprobador: {
			id_colaborador: 3,
			nombre: "Jefe",
			primer_apellido: "Admin",
			segundo_apellido: "",
			correo_electronico: "jefe@empresa.com",
		},
		saldoVacaciones: { id_saldo_vac: 5, dias_ganados: 20, dias_tomados: 4 },
		...overrides,
	};
	return {
		...base,
		get: jest.fn(() => base),
	};
};

describe("listarVacacionesPorColaborador", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
		assertId.mockImplementation((value) => Number(value));
		assertDate.mockImplementation((value) => dayjs(String(value), "YYYY-MM-DD", true));
		listDatesInclusive.mockReturnValue(["2026-03-10", "2026-03-11", "2026-03-12"]);
		fetchEstadoId.mockResolvedValue(1);
		splitDatesBySchedule.mockReturnValue({
			workingDates: ["2026-03-10", "2026-03-11"],
			restDates: ["2026-03-12"],
		});
		Contrato.findOne.mockResolvedValue({ id_contrato: 7 });
		HorarioLaboral.findOne.mockResolvedValue({ id_horario: 8 });
		JornadaDiaria.findAll.mockResolvedValue([{ vacaciones: 21, fecha: "2026-03-10" }]);
		Feriado.findAll.mockResolvedValue([{ fecha: "2026-03-11", nombre: "Feriado Demo" }]);
	});

	test("aplica filtro aprobador", async () => {
		SolicitudVacaciones.findAll.mockResolvedValue([row()]);

		await listarVacacionesPorColaborador({ id_colaborador: 10, aprobador_filter: 3 });

		expect(SolicitudVacaciones.findAll).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id_colaborador: 10,
					id_aprobador: { [Op.eq]: 3 },
				},
			})
		);
	});

	test("mapea pendientes usando workingDates y feriados/rest en skipped", async () => {
		SolicitudVacaciones.findAll.mockResolvedValue([row()]);
		const result = await listarVacacionesPorColaborador({ id_colaborador: 10 });

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(
			expect.objectContaining({
				id_solicitud_vacaciones: 21,
				dias_solicitados: "1",
				dias_aprobados: null,
				dias_solicitados_detalle: ["2026-03-10"],
				dias_skipped_detalle: expect.arrayContaining([
					expect.objectContaining({ date: "2026-03-11", reason: "FERIADO" }),
					expect.objectContaining({ date: "2026-03-12", reason: "DESCANSO" }),
				]),
			})
		);
	});

	test("mapea aprobadas usando jornadas asignadas", async () => {
		SolicitudVacaciones.findAll.mockResolvedValue([
			row({ estadoSolicitud: { id_estado: 3, estado: "APROBADO" } }),
		]);
		JornadaDiaria.findAll.mockResolvedValue([{ vacaciones: 21, fecha: "2026-03-10" }, { vacaciones: 21, fecha: "2026-03-11" }]);
		const result = await listarVacacionesPorColaborador({ id_colaborador: 10 });

		expect(result[0].dias_solicitados).toBe("2");
		expect(result[0].dias_aprobados).toBe("2");
		expect(result[0].dias_solicitados_detalle).toEqual(["2026-03-10", "2026-03-11"]);
	});

	test("sin contrato/horario/feriados aún mapea salida", async () => {
		SolicitudVacaciones.findAll.mockResolvedValue([row({ saldoVacaciones: null, estadoSolicitud: null })]);
		Contrato.findOne.mockResolvedValue(null);
		Feriado.findAll.mockResolvedValue([]);
		JornadaDiaria.findAll.mockResolvedValue([]);

		const result = await listarVacacionesPorColaborador({ id_colaborador: 10 });
		expect(result[0].saldo_vacaciones).toBeNull();
		expect(result[0].estado_solicitud).toBeNull();
	});
});
