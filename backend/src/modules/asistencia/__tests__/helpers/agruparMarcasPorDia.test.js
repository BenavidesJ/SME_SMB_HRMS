import { agruparMarcasPorDia } from "../../handlers/helpers/agruparMarcasPorDia.js";

describe("agruparMarcasPorDia", () => {
	test("retorna arreglo vacío cuando no hay marcas", () => {
		expect(agruparMarcasPorDia([])).toEqual([]);
	});

	test("agrupa marcas del mismo día", () => {
		const marcas = [
			{ id_marca: 1, tipo_marca: "ENTRADA", timestamp: "2026-02-01T08:00:00.000Z", observaciones: "N/A" },
			{ id_marca: 2, tipo_marca: "SALIDA", timestamp: "2026-02-01T17:00:00.000Z", observaciones: "N/A" },
		];

		const result = agruparMarcasPorDia(marcas);

		expect(result).toHaveLength(1);
		expect(result[0].dia).toBe("2026-02-01");
		expect(result[0].asistencia).toHaveLength(2);
	});

	test("ordena días en forma ascendente", () => {
		const marcas = [
			{ id_marca: 1, tipo_marca: "ENTRADA", timestamp: "2026-02-03T08:00:00.000Z", observaciones: "N/A" },
			{ id_marca: 2, tipo_marca: "SALIDA", timestamp: "2026-02-01T17:00:00.000Z", observaciones: "N/A" },
			{ id_marca: 3, tipo_marca: "ENTRADA", timestamp: "2026-02-02T08:00:00.000Z", observaciones: "N/A" },
		];

		const result = agruparMarcasPorDia(marcas);

		expect(result.map((item) => item.dia)).toEqual(["2026-02-01", "2026-02-02", "2026-02-03"]);
	});
});
