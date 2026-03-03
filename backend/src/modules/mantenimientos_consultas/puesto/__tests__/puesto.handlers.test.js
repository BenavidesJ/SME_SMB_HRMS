import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, Puesto, Departamento, Estado, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
  sequelize,
  models: { Puesto, Departamento, Estado },
}));

const { createPuesto } = await import("../handlers/create.js");
const { listPuestos, getPuesto } = await import("../handlers/read.js");
const { updatePuesto } = await import("../handlers/update.js");
const { deletePuesto } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/puesto handlers", () => {
  beforeEach(() => {
    reset();
  });

  test("createPuesto crea y serializa", async () => {
    Puesto.findOne.mockResolvedValue(null);
    Departamento.findOne.mockResolvedValue({ id_departamento: 2, nombre: "RRHH" });
    Estado.findOne.mockResolvedValue({ id_estado: 1, estado: "ACTIVO" });
    Puesto.create.mockResolvedValue({ id_puesto: 9 });
    Puesto.findByPk.mockResolvedValue({
      id_puesto: 9,
      nombre: "ANALISTA",
      sal_base_referencia_min: 100,
      sal_base_referencia_max: 200,
      departamento: { nombre: "RRHH" },
      estadoRef: { estado: "ACTIVO" },
    });

    await expect(createPuesto({ nombre: "ANALISTA", departamento: "RRHH" })).resolves.toEqual({
      id: 9,
      puesto: "ANALISTA",
      departamento: "RRHH",
      salario_ref_minimo: 100,
      salario_ref_maximo: 200,
      estado: "ACTIVO",
    });
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  test("createPuesto valida duplicado/departamento/estado", async () => {
    Puesto.findOne.mockResolvedValue({ id_puesto: 1, nombre: "ANALISTA" });
    await expect(createPuesto({ nombre: "ANALISTA", departamento: "RRHH" })).rejects.toThrow(
      "Ya existe un puesto con nombre ANALISTA"
    );

    reset();
    Puesto.findOne.mockResolvedValue(null);
    Departamento.findOne.mockResolvedValue(null);
    await expect(createPuesto({ nombre: "ANALISTA", departamento: "RRHH" })).rejects.toThrow(
      "No existe departamento con nombre RRHH"
    );
  });

  test("listPuestos y getPuesto", async () => {
    const row = {
      id_puesto: 2,
      nombre: "JEFE",
      sal_base_referencia_min: 500,
      sal_base_referencia_max: 900,
      departamento: { nombre: "TI" },
      estadoRef: { estado: "ACTIVO" },
    };
    Puesto.findAll.mockResolvedValue([row]);
    Puesto.findByPk.mockResolvedValue(row);

    await expect(listPuestos()).resolves.toEqual([
      {
        id: 2,
        puesto: "JEFE",
        departamento: "TI",
        salario_ref_minimo: 500,
        salario_ref_maximo: 900,
        estado: "ACTIVO",
      },
    ]);
    await expect(getPuesto({ id: 2 })).resolves.toEqual({
      id: 2,
      puesto: "JEFE",
      departamento: "TI",
      salario_ref_minimo: 500,
      salario_ref_maximo: 900,
      estado: "ACTIVO",
    });
  });

  test("updatePuesto actualiza y valida reglas", async () => {
    Puesto.findByPk
      .mockResolvedValueOnce({
        id_puesto: 4,
        nombre: "A",
        sal_base_referencia_min: 10,
        sal_base_referencia_max: 20,
        departamento: { nombre: "RRHH" },
      })
      .mockResolvedValueOnce({
        id_puesto: 4,
        nombre: "B",
        sal_base_referencia_min: 11,
        sal_base_referencia_max: 21,
        departamento: { nombre: "TI" },
        estadoRef: { estado: "ACTIVO" },
      });
    Puesto.findOne.mockResolvedValue(null);
    Departamento.findOne.mockResolvedValue({ id_departamento: 3, nombre: "TI" });
    Puesto.update.mockResolvedValue([1]);

    await expect(
      updatePuesto({
        id: 4,
        patch: { nombre: "B", departamento: "TI", sal_base_referencia_min: 11, sal_base_referencia_max: 21 },
      })
    ).resolves.toEqual({
      id: 4,
      puesto: "B",
      departamento: "TI",
      salario_ref_minimo: 11,
      salario_ref_maximo: 21,
      estado: "ACTIVO",
    });

    await expect(updatePuesto({ id: 4, patch: {} })).rejects.toThrow("No hay campos para actualizar");

    Puesto.findByPk.mockResolvedValue({
      id_puesto: 4,
      nombre: "A",
      sal_base_referencia_min: 10,
      sal_base_referencia_max: 20,
      departamento: { nombre: "RRHH" },
    });
    await expect(
      updatePuesto({ id: 4, patch: { nombre: "A", sal_base_referencia_min: 30, sal_base_referencia_max: 20 } })
    ).rejects.toThrow("El salario mínimo no puede ser mayor al máximo");
  });

  test("deletePuesto elimina y falla si no existe", async () => {
    Puesto.destroy.mockResolvedValue(1);
    await expect(deletePuesto({ id: 8 })).resolves.toEqual({ id: 8 });

    reset();
    Puesto.destroy.mockResolvedValue(0);
    await expect(deletePuesto({ id: 8 })).rejects.toThrow("No existe puesto con id 8");
  });
});
