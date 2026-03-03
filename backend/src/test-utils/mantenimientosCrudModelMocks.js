import { jest } from "@jest/globals";

export const createMantenimientosCrudModelMocks = () => {
	const transaction = {
		commit: jest.fn().mockResolvedValue(undefined),
		rollback: jest.fn().mockResolvedValue(undefined),
		finished: false,
	};

	const sequelize = {
		transaction: jest.fn().mockResolvedValue(transaction),
	};

	const Rol = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const EstadoCivil = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const TipoContrato = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const Estado = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const TipoHoraExtra = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const TipoJornada = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const Provincia = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const Canton = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const Distrito = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const Departamento = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const Puesto = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const TipoIncapacidad = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const TipoMarca = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const Feriado = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const CicloPago = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const Deduccion = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
	};

	const CausaLiquidacion = {
		findOne: jest.fn(),
		create: jest.fn(),
		findAll: jest.fn(),
		findByPk: jest.fn(),
		update: jest.fn(),
		destroy: jest.fn(),
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
		Rol,
		EstadoCivil,
		TipoContrato,
		Estado,
		TipoHoraExtra,
		TipoJornada,
		Provincia,
		Canton,
		Distrito,
		Departamento,
		Puesto,
		TipoIncapacidad,
		TipoMarca,
		Feriado,
		CicloPago,
		Deduccion,
		CausaLiquidacion,
		reset,
	};
};
