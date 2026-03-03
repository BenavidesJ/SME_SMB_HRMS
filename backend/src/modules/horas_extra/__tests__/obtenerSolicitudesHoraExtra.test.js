import { jest } from "@jest/globals";
import { Op } from "sequelize";
import { createHorasExtraModelMocks } from "../../../test-utils/horasExtraModelMocks.js";

const { SolicitudHoraExtra, TipoHoraExtra, Estado, Colaborador, reset } = createHorasExtraModelMocks();

jest.unstable_mockModule("../../../models/index.js", () => ({
	SolicitudHoraExtra,
	TipoHoraExtra,
	Estado,
	Colaborador,
}));

const { obtenerSolicitudesHoraExtra } = await import("../handlers/solicitudes/obtenerSolicitudesHoraExtra.js");

describe("obtenerSolicitudesHoraExtra", () => {
	beforeEach(() => {
		reset();
	});

	test("falla cuando el agrupamiento es inválido", async () => {
		await expect(obtenerSolicitudesHoraExtra({ agrupamiento: "mes" })).rejects.toThrow(
			"Agrupamiento inválido. Use uno de: fecha_solicitud, estado, id_colaborador"
		);
	});

	test("falla cuando id_colaborador no es numérico", async () => {
		await expect(obtenerSolicitudesHoraExtra({ id_colaborador: "abc" })).rejects.toThrow(
			"id_colaborador debe ser numérico"
		);
	});

	test("retorna items cuando agrupamiento es fecha_solicitud", async () => {
		SolicitudHoraExtra.findAll.mockResolvedValue([
			{
				id_solicitud_hx: 10,
				fecha_solicitud: new Date("2026-03-01T10:00:00Z"),
				fecha_trabajo: "2026-03-02",
				horas_solicitadas: 1.5,
				justificacion: "Cierre",
				colaborador: {
					id_colaborador: 50,
					correo_electronico: "a@empresa.com",
					nombre: "Ana",
					primer_apellido: "Pérez",
					segundo_apellido: "López",
				},
				tipoHoraExtra: { id_tipo_hx: 3, nombre: "DOBLE", multiplicador: 2 },
				estadoRef: { id_estado: 2, estado: "PENDIENTE" },
			},
		]);

		const result = await obtenerSolicitudesHoraExtra({
			agrupamiento: "fecha_solicitud",
			estado: "pendiente",
			id_colaborador: "50",
		});

		expect(SolicitudHoraExtra.findAll).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id_colaborador: 50 },
				order: [
					["fecha_solicitud", "DESC"],
					["id_solicitud_hx", "DESC"],
				],
			})
		);

		const includeEstado = SolicitudHoraExtra.findAll.mock.calls[0][0].include[2];
		expect(includeEstado.where).toEqual({ estado: { [Op.eq]: "PENDIENTE" } });

		expect(result).toEqual({
			agrupamiento: "fecha_solicitud",
			total: 1,
			items: [
				{
					id_solicitud_hx: 10,
					fecha_solicitud: new Date("2026-03-01T10:00:00Z"),
					fecha_trabajo: "2026-03-02",
					horas_solicitadas: "1.5",
					justificacion: "Cierre",
					tipo_hx: { id: 3, nombre: "DOBLE", multiplicador: "2" },
					estado: { id: 2, estado: "PENDIENTE" },
					colaborador: {
						id: 50,
						nombre_completo: "Ana Pérez López",
						correo: "a@empresa.com",
					},
				},
			],
		});
	});

	test("agrupa por estado con orden de prioridad", async () => {
		SolicitudHoraExtra.findAll.mockResolvedValue([
			{
				id_solicitud_hx: 1,
				fecha_solicitud: new Date(),
				fecha_trabajo: "2026-03-01",
				horas_solicitadas: 1,
				justificacion: "x",
				tipoHoraExtra: { id_tipo_hx: 1, nombre: "DOBLE", multiplicador: 2 },
				estadoRef: { id_estado: 8, estado: "RECHAZADO" },
				colaborador: { id_colaborador: 1, correo_electronico: "a@x.com", nombre: "A", primer_apellido: "A", segundo_apellido: "A" },
			},
			{
				id_solicitud_hx: 2,
				fecha_solicitud: new Date(),
				fecha_trabajo: "2026-03-01",
				horas_solicitadas: 2,
				justificacion: "y",
				tipoHoraExtra: { id_tipo_hx: 1, nombre: "DOBLE", multiplicador: 2 },
				estadoRef: { id_estado: 9, estado: "PENDIENTE" },
				colaborador: { id_colaborador: 1, correo_electronico: "a@x.com", nombre: "A", primer_apellido: "A", segundo_apellido: "A" },
			},
			{
				id_solicitud_hx: 5,
				fecha_solicitud: new Date(),
				fecha_trabajo: "2026-03-01",
				horas_solicitadas: 1,
				justificacion: "z",
				tipoHoraExtra: { id_tipo_hx: 1, nombre: "DOBLE", multiplicador: 2 },
				estadoRef: { id_estado: 10, estado: "EN_REVISION" },
				colaborador: { id_colaborador: 2, correo_electronico: "b@x.com", nombre: "B", primer_apellido: "B", segundo_apellido: "B" },
			},
			{
				id_solicitud_hx: 6,
				fecha_solicitud: new Date(),
				fecha_trabajo: "2026-03-01",
				horas_solicitadas: 1,
				justificacion: "z2",
				tipoHoraExtra: { id_tipo_hx: 1, nombre: "DOBLE", multiplicador: 2 },
				estadoRef: { id_estado: 9, estado: "PENDIENTE" },
				colaborador: { id_colaborador: 3, correo_electronico: "c@x.com", nombre: "C", primer_apellido: "C", segundo_apellido: "C" },
			},
		]);

		const result = await obtenerSolicitudesHoraExtra({ agrupamiento: "estado" });

		expect(result.agrupamiento).toBe("estado");
		expect(result.grupos).toHaveLength(3);
		expect(result.grupos[0].etiqueta).toBe("PENDIENTE");
		expect(result.grupos[1].etiqueta).toBe("RECHAZADO");
		expect(result.grupos[2].etiqueta).toBe("EN_REVISION");
		expect(result.grupos[0].cantidad).toBe(2);
	});

	test("agrupa por colaborador y ordena por etiqueta con fallback N/A", async () => {
		SolicitudHoraExtra.findAll.mockResolvedValue([
			{
				id_solicitud_hx: 3,
				fecha_solicitud: new Date(),
				fecha_trabajo: "2026-03-02",
				horas_solicitadas: 1,
				justificacion: "x",
				tipoHoraExtra: null,
				estadoRef: null,
				colaborador: null,
			},
			{
				id_solicitud_hx: 4,
				fecha_solicitud: new Date(),
				fecha_trabajo: "2026-03-02",
				horas_solicitadas: 2,
				justificacion: "y",
				tipoHoraExtra: { id_tipo_hx: 1, nombre: "DOBLE", multiplicador: 2 },
				estadoRef: { id_estado: 2, estado: "APROBADO" },
				colaborador: {
					id_colaborador: 2,
					correo_electronico: "z@x.com",
					nombre: "Zoe",
					primer_apellido: "Araya",
					segundo_apellido: "Q",
				},
			},
		]);

		const result = await obtenerSolicitudesHoraExtra({ agrupamiento: "id_colaborador" });

		expect(result.agrupamiento).toBe("id_colaborador");
		expect(result.total).toBe(2);
		expect(result.grupos.map((g) => g.etiqueta)).toEqual(["N/A", "Zoe Araya Q"]);
		expect(result.grupos[0].items[0].tipo_hx).toEqual({ id: undefined, nombre: undefined, multiplicador: null });
	});
});
