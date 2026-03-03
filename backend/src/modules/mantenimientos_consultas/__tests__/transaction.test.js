import { jest } from "@jest/globals";
import { createIncapacidadesMantenimientosModelMocks } from "../../../test-utils/incapacidadesMantenimientosModelMocks.js";

const { sequelize, transaction, reset } = createIncapacidadesMantenimientosModelMocks();

jest.unstable_mockModule("../../../models/index.js", () => ({ sequelize }));

const { runInTransaction } = await import("../shared/transaction.js");

describe("runInTransaction", () => {
	beforeEach(() => {
		reset();
		jest.clearAllMocks();
	});

	test("commit when work succeeds", async () => {
		const result = await runInTransaction(async () => "ok");
		expect(result).toBe("ok");
		expect(transaction.commit).toHaveBeenCalledTimes(1);
		expect(transaction.rollback).not.toHaveBeenCalled();
	});

	test("rollback when work fails", async () => {
		await expect(
			runInTransaction(async () => {
				throw new Error("boom");
			})
		).rejects.toThrow("boom");
		expect(transaction.rollback).toHaveBeenCalledTimes(1);
	});
});
