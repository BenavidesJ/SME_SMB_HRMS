import { jest } from "@jest/globals";

export const createIncapacidadesMantenimientosModelMocks = () => {
	const transaction = {
		commit: jest.fn().mockResolvedValue(undefined),
		rollback: jest.fn().mockResolvedValue(undefined),
		finished: false,
		LOCK: { UPDATE: "UPDATE" },
		afterCommit: jest.fn((callback) => callback()),
	};

	const sequelize = {
		transaction: jest.fn().mockResolvedValue(transaction),
	};

	const Colaborador = { findByPk: jest.fn(), create: jest.fn() };
	const Contrato = { findOne: jest.fn() };
	const Estado = { findOne: jest.fn() };
	const HorarioLaboral = { findOne: jest.fn() };
	const Incapacidad = { create: jest.fn(), findAll: jest.fn(), update: jest.fn() };
	const JornadaDiaria = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() };
	const TipoIncapacidad = { findOne: jest.fn() };
	const Usuario = { create: jest.fn() };
	const Direccion = { create: jest.fn() };

	const reset = () => {
		jest.clearAllMocks();
		transaction.finished = false;
		transaction.commit.mockResolvedValue(undefined);
		transaction.rollback.mockResolvedValue(undefined);
		transaction.afterCommit.mockImplementation((callback) => callback());
		sequelize.transaction.mockResolvedValue(transaction);
	};

	return {
		sequelize,
		transaction,
		Colaborador,
		Contrato,
		Estado,
		HorarioLaboral,
		Incapacidad,
		JornadaDiaria,
		TipoIncapacidad,
		Usuario,
		Direccion,
		reset,
	};
};
