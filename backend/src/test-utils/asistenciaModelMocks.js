import { jest } from "@jest/globals";
import { Op } from "sequelize";

export const createAsistenciaModelMocks = () => {
	const transaction = {
		commit: jest.fn().mockResolvedValue(undefined),
		rollback: jest.fn().mockResolvedValue(undefined),
		LOCK: { UPDATE: "UPDATE" },
		finished: false,
	};

	const sequelize = {
		transaction: jest.fn().mockResolvedValue(transaction),
		Sequelize: { Op },
	};

	const Colaborador = { findOne: jest.fn() };
	const Contrato = { findOne: jest.fn() };
	const HorarioLaboral = { findOne: jest.fn() };
	const Estado = { findOne: jest.fn() };
	const TipoMarca = { findAll: jest.fn() };
	const MarcaAsistencia = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() };
	const JornadaDiaria = { findOne: jest.fn(), create: jest.fn() };
	const SolicitudHoraExtra = { findAll: jest.fn() };
	const SolicitudVacaciones = { findOne: jest.fn() };
	const SolicitudPermisos = { findOne: jest.fn() };

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
		Op,
		Colaborador,
		Contrato,
		HorarioLaboral,
		Estado,
		TipoMarca,
		MarcaAsistencia,
		JornadaDiaria,
		SolicitudHoraExtra,
		SolicitudVacaciones,
		SolicitudPermisos,
		reset,
	};
};

export const asistenciaFixtures = {
	colaborador: {
		id_colaborador: 2,
		identificacion: 123456789,
		nombre: "Juan",
		primer_apellido: "Pérez",
		segundo_apellido: "López",
	},
	estadoActivo: { id_estado: 1, estado: "ACTIVO" },
	estadoAprobado: { id_estado: 5, estado: "APROBADO" },
	contrato: {
		id_contrato: 10,
		id_colaborador: 2,
		estado: 1,
		id_tipo_jornada: 1,
	},
	horario: {
		id_horario: 1,
		id_contrato: 10,
		hora_inicio: "08:00:00",
		hora_fin: "17:00:00",
		dias_laborales: "LKMJV",
		dias_libres: "SD",
		estado: 1,
	},
	tipoEntrada: { id_tipo_marca: 1, nombre: "ENTRADA" },
	tipoSalida: { id_tipo_marca: 2, nombre: "SALIDA" },
};
