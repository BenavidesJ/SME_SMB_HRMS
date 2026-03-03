import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, Departamento, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
  sequelize,
  models: { Departamento },
}));

const { createDepartamento } = await import("../handlers/create.js");
const { listDepartamentos, getDepartamento } = await import("../handlers/read.js");
const { updateDepartamento } = await import("../handlers/update.js");
const { deleteDepartamento } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/departamento handlers", () => {
  beforeEach(() => {
    reset();
  });

  test("createDepartamento crea y serializa", async () => {
    Departamento.findOne.mockResolvedValue(null);
    Departamento.create.mockResolvedValue({ id_departamento: 2, nombre: "RRHH" });

    await expect(createDepartamento({ nombre: "RRHH" })).resolves.toEqual({ id: 2, nombre: "RRHH" });
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  test("createDepartamento valida y evita duplicados", async () => {
    await expect(createDepartamento({ nombre: "" })).rejects.toThrow("El campo nombre es obligatorio");

    Departamento.findOne.mockResolvedValue({ id_departamento: 1, nombre: "RRHH" });
    await expect(createDepartamento({ nombre: "RRHH" })).rejects.toThrow(
      "Ya existe un departamento con nombre RRHH"
    );
  });

  test("listDepartamentos y getDepartamento", async () => {
    Departamento.findAll.mockResolvedValue([
      { id_departamento: 1, nombre: "RRHH" },
      { id_departamento: 2, nombre: "TI" },
    ]);
    Departamento.findByPk.mockResolvedValue({ id_departamento: 2, nombre: "TI" });

    await expect(listDepartamentos()).resolves.toEqual([
      { id: 1, nombre: "RRHH" },
      { id: 2, nombre: "TI" },
    ]);
    await expect(getDepartamento({ id: 2 })).resolves.toEqual({ id: 2, nombre: "TI" });
  });

  test("getDepartamento valida id y not found", async () => {
    await expect(getDepartamento({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

    Departamento.findByPk.mockResolvedValue(null);
    await expect(getDepartamento({ id: 7 })).rejects.toThrow("No existe departamento con id 7");
  });

  test("updateDepartamento actualiza y valida conflictos", async () => {
    Departamento.findByPk
      .mockResolvedValueOnce({ id_departamento: 5, nombre: "A" })
      .mockResolvedValueOnce({ id_departamento: 5, nombre: "B" });
    Departamento.findOne.mockResolvedValue(null);
    Departamento.update.mockResolvedValue([1]);

    await expect(updateDepartamento({ id: 5, patch: { nombre: "B" } })).resolves.toEqual({ id: 5, nombre: "B" });

    await expect(updateDepartamento({ id: 5, patch: {} })).rejects.toThrow("No hay campos para actualizar");

    Departamento.findByPk.mockResolvedValue(null);
    await expect(updateDepartamento({ id: 5, patch: { nombre: "C" } })).rejects.toThrow(
      "No existe departamento con id 5"
    );
  });

  test("deleteDepartamento elimina y falla si no existe", async () => {
    Departamento.destroy.mockResolvedValue(1);
    await expect(deleteDepartamento({ id: 9 })).resolves.toEqual({ id: 9 });

    reset();
    Departamento.destroy.mockResolvedValue(0);
    await expect(deleteDepartamento({ id: 9 })).rejects.toThrow("No existe departamento con id 9");
  });
});
