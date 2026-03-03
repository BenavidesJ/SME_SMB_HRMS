import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, Provincia, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
  sequelize,
  models: { Provincia },
}));

const { createProvincia } = await import("../handlers/create.js");
const { listProvincias, getProvincia } = await import("../handlers/read.js");
const { updateProvincia } = await import("../handlers/update.js");
const { deleteProvincia } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/provincia handlers", () => {
  beforeEach(() => {
    reset();
  });

  test("createProvincia crea y serializa", async () => {
    Provincia.findByPk.mockResolvedValue(null);
    Provincia.findOne.mockResolvedValue(null);
    Provincia.create.mockResolvedValue({ id_provincia: 7, nombre: "GUANACASTE" });

    await expect(createProvincia({ id_provincia: 7, nombre: "GUANACASTE" })).resolves.toEqual({
      id: 7,
      nombre: "GUANACASTE",
    });
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  test("createProvincia valida y evita duplicados", async () => {
    await expect(createProvincia({ id_provincia: "x", nombre: "A" })).rejects.toThrow(
      "El campo id_provincia debe ser un entero positivo"
    );

    Provincia.findByPk.mockResolvedValue({ id_provincia: 1, nombre: "A" });
    await expect(createProvincia({ id_provincia: 1, nombre: "A" })).rejects.toThrow("Ya existe provincia con id 1");

    reset();
    Provincia.findByPk.mockResolvedValue(null);
    Provincia.findOne.mockResolvedValue({ id_provincia: 1, nombre: "A" });
    await expect(createProvincia({ id_provincia: 2, nombre: "A" })).rejects.toThrow("Ya existe provincia con nombre A");
  });

  test("listProvincias y getProvincia", async () => {
    Provincia.findAll.mockResolvedValue([
      { id_provincia: 1, nombre: "A" },
      { id_provincia: 2, nombre: "B" },
    ]);
    Provincia.findByPk.mockResolvedValue({ id_provincia: 2, nombre: "B" });

    await expect(listProvincias()).resolves.toEqual([
      { id: 1, nombre: "A" },
      { id: 2, nombre: "B" },
    ]);
    await expect(getProvincia({ id: 2 })).resolves.toEqual({ id: 2, nombre: "B" });
  });

  test("getProvincia valida id y not found", async () => {
    await expect(getProvincia({ id: "x" })).rejects.toThrow("El campo id debe ser un entero positivo");

    Provincia.findByPk.mockResolvedValue(null);
    await expect(getProvincia({ id: 9 })).rejects.toThrow("No existe provincia con id 9");
  });

  test("updateProvincia actualiza y valida conflictos", async () => {
    Provincia.findByPk
      .mockResolvedValueOnce({ id_provincia: 2, nombre: "A" })
      .mockResolvedValueOnce({ id_provincia: 2, nombre: "B" });
    Provincia.findOne.mockResolvedValue(null);
    Provincia.update.mockResolvedValue([1]);

    await expect(updateProvincia({ id: 2, patch: { nombre: "B" } })).resolves.toEqual({ id: 2, nombre: "B" });

    await expect(updateProvincia({ id: 2, patch: {} })).rejects.toThrow("No hay campos para actualizar");

    Provincia.findByPk.mockResolvedValue(null);
    await expect(updateProvincia({ id: 2, patch: { nombre: "C" } })).rejects.toThrow("No existe provincia con id 2");
  });

  test("deleteProvincia elimina y falla si no existe", async () => {
    Provincia.destroy.mockResolvedValue(1);
    await expect(deleteProvincia({ id: 3 })).resolves.toEqual({ id: 3 });

    reset();
    Provincia.destroy.mockResolvedValue(0);
    await expect(deleteProvincia({ id: 3 })).rejects.toThrow("No existe provincia con id 3");
  });
});
