import fs from "node:fs";
import path from "node:path";
import { models, sequelize } from "../models/index.js";
const { Provincia, Canton, Distrito } = models;

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Helpers para IDs determinísticos
const toInt = (s) => Number.parseInt(String(s), 10);

const cantonId = (provId, cantonKey) => provId * 100 + toInt(cantonKey);
const distritoId = (cantId, distKey) => cantId * 100 + toInt(distKey);

export async function seedUbicaciones() {
  const filePath = path.resolve("src/seeds/data/cr-ubicaciones.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);

  const provinciasRows = [];
  const cantonesRows = [];
  const distritosRows = [];

  for (const [provKey, provVal] of Object.entries(json.provincias)) {
    const id_provincia = toInt(provKey);

    provinciasRows.push({
      id_provincia,
      nombre: provVal.nombre,
    });

    for (const [cantonKey, cantonVal] of Object.entries(provVal.cantones)) {
      const id_canton = cantonId(id_provincia, cantonKey);

      cantonesRows.push({
        id_canton,
        id_provincia,
        nombre: cantonVal.nombre,
      });

      for (const [distKey, distNombre] of Object.entries(cantonVal.distritos)) {
        const id_distrito = distritoId(id_canton, distKey);

        distritosRows.push({
          id_distrito,
          id_canton,
          nombre: distNombre,
        });
      }
    }
  }

  const t = await sequelize.transaction();
  try {
    await Provincia.bulkCreate(provinciasRows, {
      transaction: t,
      updateOnDuplicate: ["nombre"],
    });

    await Canton.bulkCreate(cantonesRows, {
      transaction: t,
      updateOnDuplicate: ["nombre", "id_provincia"],
    });

    await Distrito.bulkCreate(distritosRows, {
      transaction: t,
      updateOnDuplicate: ["nombre", "id_canton"],
    });

    await t.commit();

    console.log(
      `[seed] Ubicaciones OK: prov=${provinciasRows.length}, cant=${cantonesRows.length}, dist=${distritosRows.length}`,
    );
  } catch (err) {
    await t.rollback();
    console.error("[seed] Error ubicaciones:", err);
    throw err;
  }
}
