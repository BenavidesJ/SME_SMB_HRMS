import { jest } from "@jest/globals";

export const createSecurityModelMocks = () => {
	const transaction = {
		commit: jest.fn().mockResolvedValue(undefined),
		rollback: jest.fn().mockResolvedValue(undefined),
	};

	const sequelize = {
		transaction: jest.fn().mockResolvedValue(transaction),
	};

	const models = {
		Usuario: {
			findOne: jest.fn(),
			findByPk: jest.fn(),
		},
		Rol: {
			findByPk: jest.fn(),
		},
		Colaborador: {},
		Estado: {},
	};

	const reset = () => {
		jest.clearAllMocks();
		transaction.commit.mockResolvedValue(undefined);
		transaction.rollback.mockResolvedValue(undefined);
		sequelize.transaction.mockResolvedValue(transaction);
	};

	return {
		models,
		sequelize,
		transaction,
		reset,
	};
};
