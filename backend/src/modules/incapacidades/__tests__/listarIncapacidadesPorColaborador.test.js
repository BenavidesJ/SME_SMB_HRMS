import { jest } from "@jest/globals";
import { Op } from "sequelize";
import { createIncapacidadesMantenimientosModelMocks } from "../../../test-utils/incapacidadesMantenimientosModelMocks.js";

const { JornadaDiaria, Incapacidad, TipoIncapacidad, reset } = createIncapacidadesMantenimientosModelMocks();

jest.unstable_mockModule("../../../models/index.js", () => ({
	JornadaDiaria,
	Incapacidad,
	TipoIncapacidad,
}));

const { listarIncapacidadesPorColaborador } = await import("../handlers/listarIncapacidadesPorColaborador.js");

describe("listarIncapacidadesPorColaborador", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("valida id_colaborador entero positivo", async () => {
		await expect(listarIncapacidadesPorColaborador({ id_colaborador: "x" })).rejects.toThrow(
			"id_colaborador debe ser un entero positivo"
		);
	});

	test("retorna agrupadas por grupo ordenadas por fecha_inicio desc", async () => {
		const mkRow = (plain) => ({ get: () => plain });
		JornadaDiaria.findAll.mockResolvedValue([
			mkRow({
				id_jornada: 1,
				fecha: "2026-03-11",
				incapacidadRef: {
					id_incapacidad: 10,
					grupo: "g1",
					fecha_inicio: "2026-03-10",
					fecha_fin: "2026-03-12",
					porcentaje_patrono: 50,
					porcentaje_ccss: 50,
					tipo: { nombre: "CCSS" },
				},
			}),
			mkRow({
				id_jornada: 2,
				fecha: "2026-03-10",
				incapacidadRef: {
					id_incapacidad: 11,
					grupo: "g1",
					fecha_inicio: "2026-03-10",
					fecha_fin: "2026-03-12",
					porcentaje_patrono: 50,
					porcentaje_ccss: 50,
					tipo: { nombre: "CCSS" },
				},
			}),
			mkRow({
				id_jornada: 3,
				fecha: "2026-04-01",
				incapacidadRef: {
					id_incapacidad: 12,
					grupo: null,
					fecha_inicio: "2026-04-01",
					fecha_fin: "2026-04-01",
					porcentaje_patrono: 0,
					porcentaje_ccss: 100,
					tipo: { nombre: "LICENCIA_MATERNIDAD" },
				},
			}),
		]);

		const result = await listarIncapacidadesPorColaborador({ id_colaborador: 10 });

		expect(JornadaDiaria.findAll).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id_colaborador: 10, incapacidad: { [Op.ne]: null } },
			})
		);
		expect(result).toHaveLength(2);
		expect(result[0].fecha_inicio).toBe("2026-04-01");
		expect(result[1].grupo).toBe("g1");
		expect(result[1].dias).toHaveLength(2);
	});
});
