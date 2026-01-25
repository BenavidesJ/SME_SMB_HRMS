import { sequelize } from "../config/db.js";

import { Rol } from "../models/rol.js";
import { Genero } from "../models/genero.js";
import { Estado } from "../models/estado.js";
import { EstadoCivil } from "../models/estadoCivil.js";

export async function seedCatalogosBase() {
  const t = await sequelize.transaction();
  try {
    await Rol.bulkCreate(
      [
        { nombre: "SUPER_ADMIN" },
        { nombre: "ADMINISTRADOR" },
        { nombre: "EMPLEADO" },
      ],
      { transaction: t, updateOnDuplicate: ["nombre"] },
    );

    for (const row of [{ genero: "MASCULINO" }, { genero: "FEMENINO" }]) {
      await Genero.findOrCreate({
        where: { genero: row.genero },
        defaults: row,
        transaction: t,
      });
    }

    for (const row of [{ estado: "ACTIVO" }, { estado: "INACTIVO" }]) {
      await Estado.findOrCreate({
        where: { estado: row.estado },
        defaults: row,
        transaction: t,
      });
    }

    for (const row of [{ estado_civil: "SOLTERO" }, { estado_civil: "CASADO" }]) {
      await EstadoCivil.findOrCreate({
        where: { estado_civil: row.estado_civil },
        defaults: row,
        transaction: t,
      });
    }

    await t.commit();
    console.log("[seed] Catálogos base OK");
  } catch (err) {
    await t.rollback();
    console.error("[seed] Error catálogos base:", err);
    throw err;
  }
}
