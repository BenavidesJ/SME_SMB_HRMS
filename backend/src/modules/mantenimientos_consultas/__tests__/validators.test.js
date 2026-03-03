import {
	requirePositiveInt,
	optionalPositiveInt,
	requireNonEmptyString,
	requireUppercaseString,
	optionalUppercaseString,
	optionalString,
	requireDecimal,
	optionalDecimal,
	requireBoolean,
	optionalBoolean,
	requireDateOnly,
	optionalDateOnly,
	ensurePatchHasAllowedFields,
} from "../shared/validators.js";

describe("validators", () => {
	test("positive int validators", () => {
		expect(requirePositiveInt("2", "id")).toBe(2);
		expect(() => requirePositiveInt("x", "id")).toThrow("El campo id debe ser un entero positivo");
		expect(optionalPositiveInt(undefined, "id")).toBeUndefined();
		expect(optionalPositiveInt("3", "id")).toBe(3);
	});

	test("string validators", () => {
		expect(requireNonEmptyString(" ana ", "nombre")).toBe("ana");
		expect(() => requireNonEmptyString("", "nombre")).toThrow("El campo nombre es obligatorio");
		expect(requireUppercaseString("admin", "rol")).toBe("ADMIN");
		expect(optionalUppercaseString(undefined, "rol")).toBeUndefined();
		expect(optionalUppercaseString("user", "rol")).toBe("USER");
		expect(optionalString(undefined, "obs")).toBeUndefined();
		expect(optionalString(" ok ", "obs")).toBe("ok");
	});

	test("decimal validators", () => {
		expect(requireDecimal("1.5", "monto")).toBe(1.5);
		expect(() => requireDecimal("x", "monto")).toThrow("El campo monto debe ser numérico");
		expect(() => requireDecimal("-1", "monto", { min: 0 })).toThrow("El campo monto debe ser mayor o igual a 0");
		expect(optionalDecimal(undefined, "monto")).toBeUndefined();
		expect(optionalDecimal("3", "monto")).toBe(3);
	});

	test("boolean validators", () => {
		expect(requireBoolean(true, "activo")).toBe(true);
		expect(requireBoolean("si", "activo")).toBe(true);
		expect(requireBoolean("0", "activo")).toBe(false);
		expect(() => requireBoolean("talvez", "activo")).toThrow("El campo activo debe ser booleano");
		expect(optionalBoolean(undefined, "activo")).toBeUndefined();
		expect(optionalBoolean("no", "activo")).toBe(false);
	});

	test("date only validators", () => {
		expect(requireDateOnly("2026-03-10", "fecha")).toBe("2026-03-10");
		expect(() => requireDateOnly("10/03/2026", "fecha")).toThrow("El campo fecha debe tener formato YYYY-MM-DD");
		expect(optionalDateOnly(undefined, "fecha")).toBeUndefined();
		expect(optionalDateOnly("2026-03-11", "fecha")).toBe("2026-03-11");
	});

	test("ensurePatchHasAllowedFields", () => {
		expect(ensurePatchHasAllowedFields({ a: 1, b: 2 }, ["b", "c"])) .toEqual(["b"]);
		expect(() => ensurePatchHasAllowedFields({ x: 1 }, ["a", "b"])) .toThrow("No hay campos para actualizar");
	});
});
