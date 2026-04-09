import { db_connection } from "../config/db.js";
import { seedFeriados } from "./seed-feriados.js";

async function main() {
  await db_connection();
  await seedFeriados();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
