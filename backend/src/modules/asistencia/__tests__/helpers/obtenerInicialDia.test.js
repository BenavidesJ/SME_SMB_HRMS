import { getDayInitial } from "../../handlers/helpers/obtenerInicialDia.js";

describe("getDayInitial", () => {
	test("retorna L para lunes", () => {
		expect(getDayInitial("2026-03-02")).toBe("L");
	});

	test("retorna M para martes", () => {
		expect(getDayInitial("2026-03-03")).toBe("M");
	});

	test("retorna K para miércoles", () => {
		expect(getDayInitial("2026-03-04")).toBe("K");
	});

	test("retorna J para jueves", () => {
		expect(getDayInitial("2026-03-05")).toBe("J");
	});

	test("retorna V para viernes", () => {
		expect(getDayInitial("2026-03-06")).toBe("V");
	});

	test("retorna S para sábado", () => {
		expect(getDayInitial("2026-03-07")).toBe("S");
	});

	test("retorna D para domingo", () => {
		expect(getDayInitial("2026-03-08")).toBe("D");
	});
});
