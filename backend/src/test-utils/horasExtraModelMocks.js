import { jest } from "@jest/globals";

export const createHorasExtraModelMocks = () => {
	const transaction = {
		commit: jest.fn().mockResolvedValue(undefined),
		rollback: jest.fn().mockResolvedValue(undefined),
		finished: false,
	};

	const sequelize = {
		transaction: jest.fn().mockResolvedValue(transaction),
	};

	const SolicitudHoraExtra = {
		findByPk: jest.fn(),
		findOne: jest.fn(),
		findAll: jest.fn(),
		create: jest.fn(),
	};

	const TipoHoraExtra = {
		findByPk: jest.fn(),
	};

	const Contrato = {
		findOne: jest.fn(),
	};

	const TipoJornada = {
		findByPk: jest.fn(),
	};

	const Estado = {
		findByPk: jest.fn(),
		findOne: jest.fn(),
	};

	const Usuario = {
		findAll: jest.fn(),
	};

	const Rol = {};

	const Colaborador = {
		findByPk: jest.fn(),
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
		SolicitudHoraExtra,
		TipoHoraExtra,
		Contrato,
		TipoJornada,
		Estado,
		Usuario,
		Rol,
		Colaborador,
		reset,
	};
};

export const horasExtraFixtures = {
	estadoActivo: { id_estado: 1, estado: "ACTIVO" },
	estadoPendiente: { id_estado: 2, estado: "PENDIENTE" },
	estadoAprobado: { id_estado: 3, estado: "APROBADO" },
	estadoRechazado: { id_estado: 4, estado: "RECHAZADO" },
	tipoHoraExtra: { id_tipo_hx: 7, nombre: "DOBLE", multiplicador: 2 },
	contratoActivo: { id_contrato: 10, id_tipo_jornada: 5 },
	tipoJornada: {
		id_tipo_jornada: 5,
		tipo: "DIURNA",
		max_horas_diarias: 8,
		max_horas_semanales: 48,
	},
	colaborador: {
		id_colaborador: 11,
		correo_electronico: "colab@empresa.com",
		nombre: "Ana",
		primer_apellido: "Pérez",
		segundo_apellido: "López",
	},
	solicitud: {
		id_solicitud_hx: 99,
		id_colaborador: 11,
		fecha_solicitud: new Date("2026-03-02T10:00:00Z"),
		fecha_trabajo: "2026-03-03",
		horas_solicitadas: 2,
		id_tipo_hx: 7,
		estado: 2,
		justificacion: "Cierre de mes",
	},
};
