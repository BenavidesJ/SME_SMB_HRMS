import fs from "node:fs";
import path from "node:path";
import { models, sequelize } from "../models/index.js";

const { Feriado } = models;
const FERIADOS_PATH = path.resolve("src/seeds/data/cr-feriados-25-26.json");

function loadFeriados() {
  const raw = fs.readFileSync(FERIADOS_PATH, "utf-8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("[seed] El archivo de feriados debe contener un arreglo JSON");
  }

  return parsed.map((row) => ({
    fecha: row.fecha,
    nombre: row.nombre,
    es_obligatorio: Boolean(row.es_obligatorio),
  }));
}

export async function seedFeriados() {
  const feriados = loadFeriados();
  const t = await sequelize.transaction();

  try {
    for (const row of feriados) {
      const existing = await Feriado.findOne({ where: { fecha: row.fecha }, transaction: t });
      if (existing) {
        await existing.update(row, { transaction: t });
      } else {
        await Feriado.create(row, { transaction: t });
      }
    }

    await t.commit();
    console.log(`[seed] Feriados OK: ${feriados.length} registros procesados`);
  } catch (err) {
    await t.rollback();
    console.error("[seed] Error feriados:", err);
    throw err;
  }
}
