import { jest } from "@jest/globals";
import dayjs from "dayjs";
import { createPermisosVacacionesModelMocks } from "../../../test-utils/permisosVacacionesModelMocks.js";

const { Estado, reset } = createPermisosVacacionesModelMocks();

jest.unstable_mockModule("../../../models/index.js", () => ({
	Estado,
}));

const {
	assertId,
	assertDate,
	listDatesInclusive,
	getDayChar,
	normalizeDayChars,
	fetchEstadoId,
	collectConflictDates,
	splitDatesBySchedule,
} = await import("../handlers/utils/vacacionesUtils.js");

describe("vacacionesUtils", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("assertId valida enteros positivos", () => {
		expect(assertId("10", "id_colaborador")).toBe(10);
		expect(() => assertId("x", "id_colaborador")).toThrow("id_colaborador debe ser un entero positivo");
		expect(() => assertId(0, "id_colaborador")).toThrow("id_colaborador debe ser un entero positivo");
	});

	test("assertDate valida formato e invalidez", () => {
		expect(assertDate("2026-03-10", "fecha_inicio").format("YYYY-MM-DD")).toBe("2026-03-10");
		expect(() => assertDate("10/03/2026", "fecha_inicio")).toThrow("fecha_inicio debe tener formato YYYY-MM-DD");
	});

	test("listDatesInclusive incluye extremos", () => {
		const start = dayjs("2026-03-10", "YYYY-MM-DD", true);
		const end = dayjs("2026-03-12", "YYYY-MM-DD", true);
		expect(listDatesInclusive(start, end)).toEqual(["2026-03-10", "2026-03-11", "2026-03-12"]);
	});

	test("getDayChar y normalizeDayChars", () => {
		expect(getDayChar("2026-03-10")).toBe("M");
		expect(() => getDayChar("fecha")).toThrow("Fecha inválida");
		expect([...normalizeDayChars("lkmjvxx")]).toEqual(["L", "K", "M", "J", "V"]);
	});

	test("fetchEstadoId retorna id y falla si no existe", async () => {
		Estado.findOne.mockResolvedValue({ id_estado: 2 });
		await expect(fetchEstadoId({ transaction: { LOCK: { UPDATE: "UPDATE" } }, nombre: "ACTIVO" })).resolves.toBe(2);

		Estado.findOne.mockResolvedValue(null);
		await expect(fetchEstadoId({ transaction: { LOCK: { UPDATE: "UPDATE" } }, nombre: "ACTIVO" })).rejects.toThrow(
			'No se encontró el estado "ACTIVO" en el catálogo'
		);
	});

	test("collectConflictDates cruza rangos válidos e ignora inválidos", () => {
		const conflicts = collectConflictDates({
			solicitudes: [
				{ fecha_inicio: "2026-03-09", fecha_fin: "2026-03-11" },
				{ fecha_inicio: "invalida", fecha_fin: "2026-03-12" },
			],
			startStr: "2026-03-10",
			endStr: "2026-03-12",
		});
		expect(Array.from(conflicts).sort()).toEqual(["2026-03-10", "2026-03-11"]);
	});

	test("splitDatesBySchedule separa laborables y descanso", () => {
		const split = splitDatesBySchedule({
			requestedDates: ["2026-03-10", "2026-03-15"],
			horario: { dias_laborales: "LKMJV", dias_libres: "SD" },
		});
		expect(split.workingDates).toEqual(["2026-03-10"]);
		expect(split.restDates).toEqual(["2026-03-15"]);
	});
});
