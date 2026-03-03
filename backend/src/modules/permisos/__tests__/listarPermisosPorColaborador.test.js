import { jest } from "@jest/globals";
import { Op } from "sequelize";
import dayjs from "dayjs";
import { createPermisosVacacionesModelMocks } from "../../../test-utils/permisosVacacionesModelMocks.js";

const {
	SolicitudPermisos,
	Colaborador,
	Estado,
	JornadaDiaria,
	Contrato,
	HorarioLaboral,
	reset,
} = createPermisosVacacionesModelMocks();

const assertId = jest.fn();
const assertDate = jest.fn();
const listDatesInclusive = jest.fn();
const fetchEstadoId = jest.fn();
const splitDatesBySchedule = jest.fn();

jest.unstable_mockModule("../../../models/index.js", () => ({
	SolicitudPermisos,
	Colaborador,
	Estado,
	JornadaDiaria,
	Contrato,
	HorarioLaboral,
}));

jest.unstable_mockModule("../../vacaciones/handlers/utils/vacacionesUtils.js", () => ({
	assertId,
	assertDate,
	listDatesInclusive,
	fetchEstadoId,
	splitDatesBySchedule,
}));

const { listarPermisosPorColaborador } = await import("../handlers/listarPermisosPorColaborador.js");

const buildSolicitudRow = (overrides = {}) => ({
	id_solicitud: 20,
	id_colaborador: 10,
	id_aprobador: 3,
	fecha_inicio: "2026-03-10",
	fecha_fin: "2026-03-12",
	estadoSolicitud: { id_estado: 2, estado: "PENDIENTE" },
	con_goce_salarial: true,
	cantidad_dias: 3,
	cantidad_horas: 24,
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
	get: jest.fn(function get() {
		return { ...this, ...overrides };
	}),
	...overrides,
});

describe("listarPermisosPorColaborador", () => {
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
		HorarioLaboral.findOne.mockResolvedValue({ id_horario: 9 });
		JornadaDiaria.findAll.mockResolvedValue([{ permiso: 20, fecha: "2026-03-10" }]);
	});

	test("retorna arreglo vacío sin solicitudes", async () => {
		SolicitudPermisos.findAll.mockResolvedValue([]);
		const result = await listarPermisosPorColaborador({ id_colaborador: 10 });
		expect(result).toEqual([]);
	});

	test("aplica aprobador_filter cuando se envía", async () => {
		SolicitudPermisos.findAll.mockResolvedValue([buildSolicitudRow()]);

		await listarPermisosPorColaborador({ id_colaborador: 10, aprobador_filter: 3 });

		expect(SolicitudPermisos.findAll).toHaveBeenCalledWith(
			expect.objectContaining({
				where: {
					id_colaborador: 10,
					id_aprobador: { [Op.eq]: 3 },
				},
			})
		);
	});

	test("mapea respuesta en estado pendiente usando workingDates", async () => {
		SolicitudPermisos.findAll.mockResolvedValue([buildSolicitudRow()]);
		const result = await listarPermisosPorColaborador({ id_colaborador: 10 });

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(
			expect.objectContaining({
				id_solicitud: 20,
				tipo_permiso: "GOCE",
				dias_solicitados: "2",
				dias_aprobados: null,
				dias_solicitados_detalle: ["2026-03-10", "2026-03-11"],
			})
		);
	});

	test("mapea respuesta aprobada usando jornadas asignadas y sin horario activo", async () => {
		const row = buildSolicitudRow({ estadoSolicitud: { id_estado: 3, estado: "APROBADO" }, con_goce_salarial: false, cantidad_dias: null, cantidad_horas: null });
		SolicitudPermisos.findAll.mockResolvedValue([row]);
		Contrato.findOne.mockResolvedValue(null);
		JornadaDiaria.findAll.mockResolvedValue([{ permiso: 20, fecha: "2026-03-10" }, { permiso: 20, fecha: "2026-03-11" }]);

		const result = await listarPermisosPorColaborador({ id_colaborador: 10 });
		expect(result[0]).toEqual(
			expect.objectContaining({
				tipo_permiso: "SIN_GOCE",
				dias_solicitados: "2",
				dias_aprobados: "2",
				dias_solicitados_detalle: ["2026-03-10", "2026-03-11"],
			})
		);
	});
});
