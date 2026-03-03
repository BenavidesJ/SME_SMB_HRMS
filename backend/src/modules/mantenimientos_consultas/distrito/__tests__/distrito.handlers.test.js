import { jest } from "@jest/globals";
import { createMantenimientosCrudModelMocks } from "../../../../test-utils/mantenimientosCrudModelMocks.js";

const { sequelize, transaction, Distrito, Canton, reset } = createMantenimientosCrudModelMocks();

jest.unstable_mockModule("../../../../models/index.js", () => ({
  sequelize,
  models: { Distrito, Canton },
}));

const { createDistrito } = await import("../handlers/create.js");
const { listDistritos, getDistrito, getDistritosPorCanton } = await import("../handlers/read.js");
const { updateDistrito } = await import("../handlers/update.js");
const { deleteDistrito } = await import("../handlers/delete.js");

describe("mantenimientos_consultas/distrito handlers", () => {
  beforeEach(() => {
    reset();
  });

  test("createDistrito crea y serializa", async () => {
    Distrito.findByPk.mockResolvedValue(null);
    Canton.findByPk.mockResolvedValue({ id_canton: 2, nombre: "CENTRAL" });
    Distrito.findOne.mockResolvedValue(null);
    Distrito.create.mockResolvedValue({ id_distrito: 11, id_canton: 2, nombre: "MATA REDONDA" });

    await expect(createDistrito({ id_distrito: 11, id_canton: 2, nombre: "MATA REDONDA" })).resolves.toEqual({
      id: 11,
      id_canton: 2,
      nombre: "MATA REDONDA",
    });
    expect(transaction.commit).toHaveBeenCalledTimes(1);
  });

  test("createDistrito valida id/cantón y duplicados", async () => {
    Distrito.findByPk.mockResolvedValue({ id_distrito: 11 });
    await expect(createDistrito({ id_distrito: 11, id_canton: 2, nombre: "A" })).rejects.toThrow(
      "Ya existe un distrito con id 11"
    );

    reset();
    Distrito.findByPk.mockResolvedValue(null);
    Canton.findByPk.mockResolvedValue(null);
    await expect(createDistrito({ id_distrito: 11, id_canton: 2, nombre: "A" })).rejects.toThrow(
      "No existe cantón con id 2"
    );
  });

  test("listDistritos, getDistrito y getDistritosPorCanton", async () => {
    Distrito.findAll
      .mockResolvedValueOnce([
        { id_distrito: 1, id_canton: 2, nombre: "A" },
        { id_distrito: 2, id_canton: 2, nombre: "B" },
      ])
      .mockResolvedValueOnce([{ id_distrito: 3, id_canton: 4, nombre: "C" }]);
    Distrito.findByPk.mockResolvedValue({ id_distrito: 2, id_canton: 2, nombre: "B" });

    await expect(listDistritos()).resolves.toEqual([
      { id: 1, id_canton: 2, nombre: "A" },
      { id: 2, id_canton: 2, nombre: "B" },
    ]);
    await expect(getDistrito({ id: 2 })).resolves.toEqual({ id: 2, id_canton: 2, nombre: "B" });
    await expect(getDistritosPorCanton({ id_canton: 4 })).resolves.toEqual([{ id: 3, id_canton: 4, nombre: "C" }]);
  });

  test("updateDistrito actualiza y valida conflictos", async () => {
    Distrito.findByPk
      .mockResolvedValueOnce({ id_distrito: 5, id_canton: 2, nombre: "X" })
      .mockResolvedValueOnce({ id_distrito: 5, id_canton: 3, nombre: "Y" });
    Canton.findByPk.mockResolvedValue({ id_canton: 3, nombre: "GOICO" });
    Distrito.findOne.mockResolvedValue(null);
    Distrito.update.mockResolvedValue([1]);

    await expect(updateDistrito({ id: 5, patch: { id_canton: 3, nombre: "Y" } })).resolves.toEqual({
      id: 5,
      id_canton: 3,
      nombre: "Y",
    });

    await expect(updateDistrito({ id: 5, patch: {} })).rejects.toThrow("No hay campos para actualizar");

    Distrito.findByPk.mockResolvedValue(null);
    await expect(updateDistrito({ id: 5, patch: { nombre: "Z" } })).rejects.toThrow("No existe distrito con id 5");
  });

  test("deleteDistrito elimina y falla si no existe", async () => {
    Distrito.destroy.mockResolvedValue(1);
    await expect(deleteDistrito({ id: 7 })).resolves.toEqual({ id: 7 });

    reset();
    Distrito.destroy.mockResolvedValue(0);
    await expect(deleteDistrito({ id: 7 })).rejects.toThrow("No existe distrito con id 7");
  });
});
