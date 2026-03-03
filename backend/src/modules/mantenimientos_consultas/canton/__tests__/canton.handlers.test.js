import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, Canton, Provincia, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
  sequelize,
  models: { Canton, Provincia },
}));

const { createCanton } = await import("../handlers/create.js");
const { listCantones, getCanton, getCantonPorProvincia } = await import("../handlers/read.js");
const { updateCanton } = await import("../handlers/update.js");
const { deleteCanton } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/canton handlers", () => {
  beforeEach(() => {
    reset();
  });

  test("createCanton crea y serializa", async () => {
    Provincia.findByPk.mockResolvedValue({ id_provincia: 1, nombre: "SJ" });
    Canton.findOne.mockResolvedValue(null);
    Canton.create.mockResolvedValue({ id_canton: 8, id_provincia: 1, nombre: "CENTRAL" });

    await expect(createCanton({ id_provincia: 1, nombre: "CENTRAL" })).resolves.toEqual({
      id: 8,
      id_provincia: 1,
      nombre: "CENTRAL",
    });
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  test("createCanton valida provincia y duplicados", async () => {
    Provincia.findByPk.mockResolvedValue(null);
    await expect(createCanton({ id_provincia: 1, nombre: "A" })).rejects.toThrow("No existe provincia con id 1");

    reset();
    Provincia.findByPk.mockResolvedValue({ id_provincia: 1 });
    Canton.findOne.mockResolvedValue({ id_canton: 4, id_provincia: 1, nombre: "A" });
    await expect(createCanton({ id_provincia: 1, nombre: "A" })).rejects.toThrow(
      "Ya existe un cantón A en la provincia 1"
    );
  });

  test("listCantones, getCanton y getCantonPorProvincia", async () => {
    Canton.findAll
      .mockResolvedValueOnce([
        { id_canton: 1, id_provincia: 1, nombre: "A" },
        { id_canton: 2, id_provincia: 1, nombre: "B" },
      ])
      .mockResolvedValueOnce([{ id_canton: 3, id_provincia: 2, nombre: "C" }]);
    Canton.findByPk.mockResolvedValue({ id_canton: 2, id_provincia: 1, nombre: "B" });

    await expect(listCantones()).resolves.toEqual([
      { id: 1, id_provincia: 1, nombre: "A" },
      { id: 2, id_provincia: 1, nombre: "B" },
    ]);
    await expect(getCanton({ id: 2 })).resolves.toEqual({ id: 2, id_provincia: 1, nombre: "B" });
    await expect(getCantonPorProvincia({ id_provincia: 2 })).resolves.toEqual([
      { id: 3, id_provincia: 2, nombre: "C" },
    ]);
  });

  test("getCanton valida id y not found", async () => {
    await expect(getCanton({ id: 0 })).rejects.toThrow("El campo id debe ser un entero positivo");

    Canton.findByPk.mockResolvedValue(null);
    await expect(getCanton({ id: 5 })).rejects.toThrow("No existe cantón con id 5");
  });

  test("updateCanton actualiza y valida conflictos", async () => {
    Canton.findByPk
      .mockResolvedValueOnce({ id_canton: 4, id_provincia: 1, nombre: "X" })
      .mockResolvedValueOnce({ id_canton: 4, id_provincia: 2, nombre: "Y" });
    Provincia.findByPk.mockResolvedValue({ id_provincia: 2, nombre: "ALAJ" });
    Canton.findOne.mockResolvedValue(null);
    Canton.update.mockResolvedValue([1]);

    await expect(updateCanton({ id: 4, patch: { id_provincia: 2, nombre: "Y" } })).resolves.toEqual({
      id: 4,
      id_provincia: 2,
      nombre: "Y",
    });

    await expect(updateCanton({ id: 4, patch: {} })).rejects.toThrow("No hay campos para actualizar");

    Canton.findByPk.mockResolvedValue(null);
    await expect(updateCanton({ id: 4, patch: { nombre: "Z" } })).rejects.toThrow("No existe cantón con id 4");
  });

  test("deleteCanton elimina y falla si no existe", async () => {
    Canton.destroy.mockResolvedValue(1);
    await expect(deleteCanton({ id: 10 })).resolves.toEqual({ id: 10 });

    reset();
    Canton.destroy.mockResolvedValue(0);
    await expect(deleteCanton({ id: 10 })).rejects.toThrow("No existe cantón con id 10");
  });
});
