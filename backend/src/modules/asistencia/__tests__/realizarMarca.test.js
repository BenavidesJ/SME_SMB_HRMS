import { jest } from "@jest/globals";
import { Op } from "sequelize";

// ── Mocks de modelos 
const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
  LOCK: { UPDATE: "UPDATE" },
  finished: false,
};

const mockModels = {
  sequelize: {
    transaction: jest.fn(() => mockTransaction),
    Sequelize: { Op },
  },
  Colaborador: { findOne: jest.fn() },
  Contrato: { findOne: jest.fn() },
  HorarioLaboral: { findOne: jest.fn() },
  Estado: { findOne: jest.fn() },
  TipoMarca: { findAll: jest.fn() },
  MarcaAsistencia: { findAll: jest.fn(), create: jest.fn() },
  JornadaDiaria: { findOne: jest.fn(), create: jest.fn() },
  SolicitudHoraExtra: { findAll: jest.fn() },
  SolicitudVacaciones: { findOne: jest.fn() },
  SolicitudPermisos: { findOne: jest.fn() },
};

jest.unstable_mockModule("../../../models/index.js", () => ({
  ...mockModels,
  Op,
}));

jest.unstable_mockModule("../handlers/helpers/obtenerInicialDia.js", () => ({
  getDayInitial: jest.fn(() => "L"), // Lunes por defecto
}));

const { registrarMarcaAsistencia } = await import(
  "../handlers/realizarMarca.js"
);
const { getDayInitial } = await import(
  "../handlers/helpers/obtenerInicialDia.js"
);

// ── Datos de prueba 
const COLAB = {
  id_colaborador: 2,
  identificacion: 123456789,
  nombre: "Juan",
  primer_apellido: "Pérez",
  segundo_apellido: "López",
};

const ESTADO_ACTIVO = { id_estado: 1, estado: "ACTIVO" };
const ESTADO_APROBADO = { id_estado: 5, estado: "APROBADO" };

const CONTRATO = {
  id_contrato: 10,
  id_colaborador: 2,
  estado: 1,
  id_tipo_jornada: 1,
};

const HORARIO = {
  id_horario: 1,
  id_contrato: 10,
  hora_inicio: "08:00:00",
  hora_fin: "17:00:00",
  dias_laborales: "LKMJV",
  dias_libres: "SD",
  estado: 1,
};

const TIPO_ENTRADA = { id_tipo_marca: 1, nombre: "ENTRADA" };
const TIPO_SALIDA = { id_tipo_marca: 2, nombre: "SALIDA" };

function resetMocks() {
  jest.clearAllMocks();
  mockTransaction.finished = false;
  mockTransaction.commit.mockResolvedValue();
  mockTransaction.rollback.mockResolvedValue();
}

function setupBaseMocks(overrides = {}) {
  mockModels.Colaborador.findOne.mockResolvedValue(COLAB);

  mockModels.Estado.findOne
    .mockResolvedValueOnce(ESTADO_ACTIVO)
    .mockResolvedValueOnce(ESTADO_APROBADO);

  mockModels.Contrato.findOne.mockResolvedValue(CONTRATO);
  mockModels.HorarioLaboral.findOne.mockResolvedValue(
    overrides.horario ?? HORARIO
  );

  mockModels.JornadaDiaria.findOne.mockResolvedValue(null);
  mockModels.SolicitudVacaciones.findOne.mockResolvedValue(null);
  mockModels.SolicitudPermisos.findOne.mockResolvedValue(null);

  getDayInitial.mockReturnValue(overrides.dayInitial ?? "L");

  mockModels.TipoMarca.findAll.mockResolvedValue([TIPO_ENTRADA, TIPO_SALIDA]);

  mockModels.MarcaAsistencia.findAll.mockResolvedValue(
    overrides.marcasPrevias ?? []
  );

  mockModels.MarcaAsistencia.create.mockResolvedValue({
    id_marca: 9999,
    id_colaborador: 2,
    id_tipo_marca: 1,
    timestamp: new Date("2026-02-02T08:00:00"),
  });

  mockModels.SolicitudHoraExtra.findAll.mockResolvedValue(
    overrides.solicitudesHX ?? []
  );

  if (!overrides.skipJornadaSetup) {
    mockModels.JornadaDiaria.findOne
      .mockResolvedValueOnce(null) 
      .mockResolvedValueOnce(overrides.jornadaExistente ?? null);
  }

  mockModels.JornadaDiaria.create.mockResolvedValue({});
}

describe("registrarMarcaAsistencia", () => {
  beforeEach(() => resetMocks());

  describe("Validaciones de entrada", () => {
    test("lanza error si identificación es vacía", async () => {
      await expect(
        registrarMarcaAsistencia({
          identificacion: "",
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow("La identificación es obligatoria");

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    test("lanza error si identificación es null", async () => {
      await expect(
        registrarMarcaAsistencia({
          identificacion: null,
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow("La identificación es obligatoria");
    });

    test("lanza error si identificación no es numérica", async () => {
      await expect(
        registrarMarcaAsistencia({
          identificacion: "abc",
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow("La identificación debe ser numérica");
    });

    test("lanza error si tipo_marca no es ENTRADA ni SALIDA", async () => {
      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "PAUSA",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow("tipo_marca debe ser ENTRADA o SALIDA");
    });

    test("lanza error si tipo_marca está vacío", async () => {
      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow("El tipo de marca es obligatorio");
    });

    test("lanza error si timestamp es inválido", async () => {
      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "ENTRADA",
          timestamp: "no-es-fecha",
        })
      ).rejects.toThrow("El timestamp no es una fecha válida");
    });

    test("lanza error si timestamp falta", async () => {
      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "ENTRADA",
          timestamp: null,
        })
      ).rejects.toThrow("El timestamp es obligatorio");
    });
  });

  describe("Validaciones de negocio", () => {
    test("lanza error si el colaborador no existe", async () => {
      mockModels.Colaborador.findOne.mockResolvedValue(null);
      mockModels.Estado.findOne.mockResolvedValue(ESTADO_ACTIVO);

      await expect(
        registrarMarcaAsistencia({
          identificacion: "999999",
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow("No existe un colaborador con identificación");
    });

    test("lanza error si no tiene contrato activo", async () => {
      mockModels.Colaborador.findOne.mockResolvedValue(COLAB);
      mockModels.Estado.findOne
        .mockResolvedValueOnce(ESTADO_ACTIVO)
        .mockResolvedValueOnce(ESTADO_APROBADO);
      mockModels.Contrato.findOne.mockResolvedValue(null);

      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow("El colaborador no tiene un contrato ACTIVO");
    });

    test("lanza error si no tiene horario activo", async () => {
      mockModels.Colaborador.findOne.mockResolvedValue(COLAB);
      mockModels.Estado.findOne
        .mockResolvedValueOnce(ESTADO_ACTIVO)
        .mockResolvedValueOnce(ESTADO_APROBADO);
      mockModels.Contrato.findOne.mockResolvedValue(CONTRATO);
      mockModels.HorarioLaboral.findOne.mockResolvedValue(null);

      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow("no tiene un horario ACTIVO asignado");
    });

    test("lanza error si tiene jornada bloqueada por incapacidad", async () => {
      mockModels.Colaborador.findOne.mockResolvedValue(COLAB);
      mockModels.Estado.findOne
        .mockResolvedValueOnce(ESTADO_ACTIVO)
        .mockResolvedValueOnce(ESTADO_APROBADO);
      mockModels.Contrato.findOne.mockResolvedValue(CONTRATO);
      mockModels.HorarioLaboral.findOne.mockResolvedValue(HORARIO);
      mockModels.JornadaDiaria.findOne.mockResolvedValue({
        incapacidad: 1,
        vacaciones: null,
        permiso: null,
      });

      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow("incapacidad");
    });

    test("lanza error si el día es libre según horario", async () => {
      setupBaseMocks({ dayInitial: "S" });

      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-07T08:00:00",
        })
      ).rejects.toThrow("es día libre");
    });
  });

  describe("Control de marcas duplicadas", () => {
    test("lanza error si ya existe ENTRADA para el día", async () => {
      setupBaseMocks({
        marcasPrevias: [
          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date("2026-02-02T08:00:00") },
        ],
      });

      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-02T09:00:00",
        })
      ).rejects.toThrow("Ya existe una marca de ENTRADA para este día");
    });

    test("lanza error si SALIDA sin ENTRADA previa", async () => {
      setupBaseMocks({ marcasPrevias: [] });

      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "SALIDA",
          timestamp: "2026-02-02T17:00:00",
        })
      ).rejects.toThrow("No se puede registrar SALIDA sin una ENTRADA previa");
    });

    test("lanza error si ya existe SALIDA para el día", async () => {
      setupBaseMocks({
        marcasPrevias: [
          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date("2026-02-02T08:00:00") },
          { tipoMarca: { nombre: "SALIDA" }, timestamp: new Date("2026-02-02T17:00:00") },
        ],
      });

      await expect(
        registrarMarcaAsistencia({
          identificacion: "123456789",
          tipo_marca: "SALIDA",
          timestamp: "2026-02-02T18:00:00",
        })
      ).rejects.toThrow("Ya existe una marca de SALIDA para este día");
    });
  });

  describe("Marca de ENTRADA", () => {
    test("crea la marca y retorna sin calcular jornada", async () => {
      setupBaseMocks();

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "ENTRADA",
        timestamp: "2026-02-02T08:00:00",
      });

      expect(mockModels.MarcaAsistencia.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result.tipo_marca).toBe("ENTRADA");
      expect(result.colaborador.id_colaborador).toBe(2);
      expect(result.jornada.horas_ordinarias).toBe(0);
      expect(result.jornada.horas_extra).toBe(0);
    });
  });

  describe("Marca de SALIDA - Cálculo de horas", () => {
    function setupSalidaMocks({
      horaEntrada = "2026-02-02T08:00:00",
      horaSalida = "2026-02-02T17:00:00",
      horario = HORARIO,
      solicitudesHX = [],
      jornadaExistente = null,
    } = {}) {
      setupBaseMocks({
        horario,
        solicitudesHX,
        marcasPrevias: [
          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date(horaEntrada) },
        ],
      });

      mockModels.MarcaAsistencia.create.mockResolvedValue({
        id_marca: 9999,
        id_colaborador: 2,
        id_tipo_marca: TIPO_SALIDA.id_tipo_marca,
        timestamp: new Date(horaSalida),
      });

      mockModels.MarcaAsistencia.findAll
        .mockResolvedValueOnce([

          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date(horaEntrada) },
        ])
        .mockResolvedValueOnce([

          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date(horaEntrada) },
          { tipoMarca: { nombre: "SALIDA" }, timestamp: new Date(horaSalida) },
        ]);


      mockModels.JornadaDiaria.findOne
        .mockResolvedValueOnce(null) 
        .mockResolvedValueOnce(jornadaExistente); 
    }

    test("08:00→17:00, turno 08-17 → 9h ordinarias, 0 extra", async () => {
      setupSalidaMocks();

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T17:00:00",
      });

      expect(result.jornada.horas_ordinarias).toBe(9);
      expect(result.jornada.horas_extra).toBe(0);
      expect(mockModels.JornadaDiaria.create).toHaveBeenCalledWith(
        expect.objectContaining({
          horas_ordinarias: 9,
          horas_extra: 0,
        }),
        expect.any(Object)
      );
    });

    test("08:30→17:00, turno 08-17 → 8.5h ordinarias, 0 extra", async () => {
      setupSalidaMocks({ horaEntrada: "2026-02-02T08:30:00" });

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T17:00:00",
      });

      expect(result.jornada.horas_ordinarias).toBe(8.5);
      expect(result.jornada.horas_extra).toBe(0);
    });

    test("08:00→16:00, turno 08-17 → 8h ordinarias, 0 extra", async () => {
      setupSalidaMocks({ horaSalida: "2026-02-02T16:00:00" });

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T16:00:00",
      });

      expect(result.jornada.horas_ordinarias).toBe(8);
      expect(result.jornada.horas_extra).toBe(0);
    });

    test("08:00→18:00, turno 08-17, SIN solicitud → 9h ord, 0 extra", async () => {
      setupSalidaMocks({
        horaSalida: "2026-02-02T18:00:00",
        solicitudesHX: [], 
      });

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T18:00:00",
      });


      expect(result.jornada.horas_ordinarias).toBe(9);

      expect(result.jornada.horas_extra).toBe(0);
    });

    test("08:00→18:00, turno 08-17, CON 2h aprobadas → 9h ord, 1h extra", async () => {
      setupSalidaMocks({
        horaSalida: "2026-02-02T18:00:00",
        solicitudesHX: [{ horas_solicitadas: 2 }],
      });

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T18:00:00",
      });

      expect(result.jornada.horas_ordinarias).toBe(9);

      expect(result.jornada.horas_extra).toBe(1);
    });

    test("08:00→19:00, turno 08-17, CON 2h aprobadas → 9h ord, 2h extra", async () => {
      setupSalidaMocks({
        horaSalida: "2026-02-02T19:00:00",
        solicitudesHX: [{ horas_solicitadas: 2 }],
      });

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T19:00:00",
      });

      expect(result.jornada.horas_ordinarias).toBe(9);

      expect(result.jornada.horas_extra).toBe(2);
    });

    test("08:00→20:00, turno 08-17, CON 2h aprobadas → 9h ord, 2h extra (limita a aprobadas)", async () => {
      setupSalidaMocks({
        horaSalida: "2026-02-02T20:00:00",
        solicitudesHX: [{ horas_solicitadas: 2 }],
      });

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T20:00:00",
      });

      expect(result.jornada.horas_ordinarias).toBe(9);

      expect(result.jornada.horas_extra).toBe(2);
    });

    test("múltiples solicitudes se suman", async () => {
      setupSalidaMocks({
        horaSalida: "2026-02-02T20:00:00",
        solicitudesHX: [
          { horas_solicitadas: 1 },
          { horas_solicitadas: 1.5 },
        ],
      });

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T20:00:00",
      });

      expect(result.jornada.horas_ordinarias).toBe(9);

      expect(result.jornada.horas_extra).toBe(2.5);
    });
  });


  describe("Tope legal de 12 horas", () => {
    function setupSalidaConTope({
      horaEntrada = "2026-02-02T08:00:00",
      horaSalida,
      solicitudesHX,
    }) {
      setupBaseMocks({
        solicitudesHX,
        marcasPrevias: [
          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date(horaEntrada) },
        ],
      });

      mockModels.MarcaAsistencia.create.mockResolvedValue({
        id_marca: 9999,
        id_colaborador: 2,
        id_tipo_marca: 2,
        timestamp: new Date(horaSalida),
      });

      mockModels.MarcaAsistencia.findAll
        .mockResolvedValueOnce([
          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date(horaEntrada) },
        ])
        .mockResolvedValueOnce([
          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date(horaEntrada) },
          { tipoMarca: { nombre: "SALIDA" }, timestamp: new Date(horaSalida) },
        ]);

      mockModels.JornadaDiaria.findOne
        .mockResolvedValueOnce(null) 
        .mockResolvedValueOnce(null); 
    }

    test("08:00→23:00, turno 08-17, CON 10h aprobadas → 9h ord, 3h extra (tope 12)", async () => {
      setupSalidaConTope({
        horaSalida: "2026-02-02T23:00:00",
        solicitudesHX: [{ horas_solicitadas: 10 }],
      });

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T23:00:00",
      });


      expect(result.jornada.horas_ordinarias).toBe(9);
      expect(result.jornada.horas_extra).toBe(3);
      expect(result.jornada.horas_ordinarias + result.jornada.horas_extra).toBeLessThanOrEqual(12);
    });

    test("06:00→22:00, turno 06-14, CON 5h aprobadas → 8h ord, 4h extra (tope 12)", async () => {
      setupSalidaConTope({
        horaEntrada: "2026-02-02T06:00:00",
        horaSalida: "2026-02-02T22:00:00",
        solicitudesHX: [{ horas_solicitadas: 5 }],
      });


      mockModels.HorarioLaboral.findOne.mockResolvedValue({
        ...HORARIO,
        hora_inicio: "06:00:00",
        hora_fin: "14:00:00",
      });

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T22:00:00",
      });


      expect(result.jornada.horas_ordinarias).toBe(8);
      expect(result.jornada.horas_extra).toBe(4);
      expect(result.jornada.horas_ordinarias + result.jornada.horas_extra).toBeLessThanOrEqual(12);
    });
  });


  describe("Actualización de jornada existente", () => {
    test("actualiza jornada si ya existe registro para el día", async () => {
      const mockUpdate = jest.fn().mockResolvedValue();
      const jornadaExistente = {
        id_jornada: 100,
        id_colaborador: 2,
        fecha: "2026-02-02",
        horas_ordinarias: 0,
        horas_extra: 0,
        update: mockUpdate,
      };

      setupBaseMocks({
        marcasPrevias: [
          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date("2026-02-02T08:00:00") },
        ],
      });

      mockModels.MarcaAsistencia.create.mockResolvedValue({
        id_marca: 9999,
        id_colaborador: 2,
        id_tipo_marca: 2,
        timestamp: new Date("2026-02-02T17:00:00"),
      });

      mockModels.MarcaAsistencia.findAll
        .mockReset()
        .mockResolvedValueOnce([
          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date("2026-02-02T08:00:00") },
        ])
        .mockResolvedValueOnce([
          { tipoMarca: { nombre: "ENTRADA" }, timestamp: new Date("2026-02-02T08:00:00") },
          { tipoMarca: { nombre: "SALIDA" }, timestamp: new Date("2026-02-02T17:00:00") },
        ]);


      mockModels.JornadaDiaria.findOne
        .mockReset()
        .mockResolvedValueOnce(null)         
        .mockResolvedValueOnce(jornadaExistente); 

      await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "SALIDA",
        timestamp: "2026-02-02T17:00:00",
      });

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          horas_ordinarias: 9,
          horas_extra: 0,
        }),
        expect.any(Object)
      );
      expect(mockModels.JornadaDiaria.create).not.toHaveBeenCalled();
    });
  });


  describe("Control de transacciones", () => {
    test("hace commit en flujo exitoso", async () => {
      setupBaseMocks();

      await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "ENTRADA",
        timestamp: "2026-02-02T08:00:00",
      });

      expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    test("hace rollback en caso de error", async () => {
      mockModels.Colaborador.findOne.mockResolvedValue(null);
      mockModels.Estado.findOne.mockResolvedValue(ESTADO_ACTIVO);

      await expect(
        registrarMarcaAsistencia({
          identificacion: "999",
          tipo_marca: "ENTRADA",
          timestamp: "2026-02-02T08:00:00",
        })
      ).rejects.toThrow();

      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });
  });


  describe("Estructura de respuesta", () => {
    test("retorna la estructura correcta en marca ENTRADA", async () => {
      setupBaseMocks();

      const result = await registrarMarcaAsistencia({
        identificacion: "123456789",
        tipo_marca: "ENTRADA",
        timestamp: "2026-02-02T08:00:00",
      });

      expect(result).toEqual(
        expect.objectContaining({
          id_marca: expect.any(Number),
          colaborador: expect.objectContaining({
            id_colaborador: 2,
            identificacion: 123456789,
            nombre: "Juan",
            primer_apellido: "Pérez",
            segundo_apellido: "López",
          }),
          tipo_marca: "ENTRADA",
          timestamp: expect.any(Date),
          fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          jornada: expect.objectContaining({
            fecha: expect.any(String),
            horas_ordinarias: expect.any(Number),
            horas_extra: expect.any(Number),
          }),
        })
      );
    });
  });
});
