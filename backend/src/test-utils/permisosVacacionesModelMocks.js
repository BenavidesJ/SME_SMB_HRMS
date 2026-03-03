import { jest } from "@jest/globals";

export const createPermisosVacacionesModelMocks = () => {
	const transaction = {
		commit: jest.fn().mockResolvedValue(undefined),
		rollback: jest.fn().mockResolvedValue(undefined),
		finished: false,
		LOCK: { UPDATE: "UPDATE" },
	};

	const sequelize = {
		transaction: jest.fn().mockResolvedValue(transaction),
	};

	const Colaborador = {
		findByPk: jest.fn(),
	};

	const Contrato = {
		findOne: jest.fn(),
	};

	const HorarioLaboral = {
		findOne: jest.fn(),
	};

	const JornadaDiaria = {
		findAll: jest.fn(),
		create: jest.fn(),
	};

	const SolicitudPermisos = {
		findAll: jest.fn(),
		findByPk: jest.fn(),
		create: jest.fn(),
	};

	const SolicitudVacaciones = {
		findAll: jest.fn(),
		findByPk: jest.fn(),
		create: jest.fn(),
	};

	const Usuario = {
		findByPk: jest.fn(),
		findOne: jest.fn(),
	};

	const Estado = {
		findOne: jest.fn(),
	};

	const SaldoVacaciones = {
		findOne: jest.fn(),
		findByPk: jest.fn(),
	};

	const Feriado = {
		findAll: jest.fn(),
	};

	const reset = () => {
		jest.clearAllMocks();
		transaction.finished = false;
		transaction.commit.mockResolvedValue(undefined);
		transaction.rollback.mockResolvedValue(undefined);
		sequelize.transaction.mockResolvedValue(transaction);
	};

	return {
		sequelize,
		transaction,
		Colaborador,
		Contrato,
		HorarioLaboral,
		JornadaDiaria,
		SolicitudPermisos,
		SolicitudVacaciones,
		Usuario,
		Estado,
		SaldoVacaciones,
		Feriado,
		reset,
	};
};
